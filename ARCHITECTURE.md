# CM OS PRO — Content Operating System para Instagram
## Documento de Arquitectura y Planificación (v2 — pendiente de aprobación final)

> v2 incorpora los cambios solicitados sobre la v1: Drizzle en vez de Prisma, RLS de Supabase como única fuente de verdad de seguridad, arquitectura basada en eventos, sistema de plugins multi-plataforma, permisos granulares, seis módulos nuevos (Activity Log, Notifications, Trash, Favorites, Templates, Recently Viewed), módulo de Brief de Contenido, y roadmap reordenado (Infraestructura → Producción → Creatividad → IA y optimización). Siguen sin resolverse dos puntos operativos que no dependen de arquitectura: qué hacer con el scaffold roto existente, y el permiso de GitHub para poder pushear (ver el cierre del documento).

---

## 0. Auditoría del estado actual del repositorio

Sigue sin cambios desde v1 — todavía no se tocó código de producto:

```
README.md                (describe un stack distinto: Next.js 14 + Supabase + React Query + @dnd-kit,
                           dice "13 tablas con RLS configuradas" y "Fase 4: Infra Setup")
app/page.tsx              → importa components/dashboard/Dashboard (el archivo NO existe en esa ruta)
app/test/page.tsx         → página de test que consulta Supabase (workspaces/users/clients)
app/test/app/api/test/components/dashboard/Dashboard.tsx   ← ruta anidada rota
app/test/app/api/test/route.ts                              ← idem
```

No hay `package.json`, `tsconfig.json`, `next.config`, ni migraciones reales. Sigue pendiente tu decisión sobre qué hacer con esto (pregunta al cierre del documento).

---

## 1. Arquitectura propuesta

### 1.1 Stack

| Capa | Elección | Motivo |
|---|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript estricto | RSC para vistas de datos, Server Actions para mutaciones |
| UI | Tailwind CSS + shadcn/ui (Radix) | Look Notion/Linear, accesible, theming claro/oscuro vía CSS vars |
| Animación | Framer Motion | Transiciones de panel, drag feedback, layout animations |
| Estado cliente | Zustand por módulo | Estado local complejo (canvas, feed builder) sin boilerplate |
| Estado servidor/cache | TanStack Query, solo en vistas client-heavy (moodboard, feed builder, kanban optimista) | El resto usa RSC + Server Actions directamente |
| **ORM** | **Drizzle ORM + drizzle-kit** *(reemplaza a Prisma)* | SQL-like, tipado end-to-end, migraciones ligeras, y — a diferencia de Prisma — tiene soporte de primera clase para declarar políticas RLS de Supabase dentro del propio schema (`drizzle-orm/supabase`), lo que permite mantener schema y políticas de seguridad versionados juntos |
| Base de datos | PostgreSQL (Supabase) | — |
| **Seguridad** | **Supabase Auth + PostgreSQL RLS como única fuente de verdad** *(resuelve el conflicto de v1 §6.2)* | Ver §1.5 |
| Storage de archivos | Supabase Storage | Ya integrado con Supabase Auth, evita un proveedor extra |
| **Event Bus** | Emisor interno tipado + tabla `event_log` (outbox) | Ver §1.6 |
| **Plugins** | Registro de plataformas en código (`PlatformPlugin`) | Ver §1.7 |
| Editor enriquecido | TipTap | Manual Maestro tipo wiki |
| Canvas infinito | React Flow (custom nodes) | Moodboard |
| Drag & drop general | @dnd-kit | Más liviano y accesible que React DnD |
| Calendario | React Big Calendar | — |
| Grillas reordenables | @dnd-kit sortable + CSS grid para el Feed/Platform Preview; `react-grid-layout` solo para widgets de Dashboard | Ver v1 §7.3 |
| Validación | Zod (compartido cliente/servidor) | Single source of truth para formularios y Server Actions |
| Testing | Vitest + Testing Library + Playwright | Lógica + regresión visual de flujos críticos |

### 1.2 Patrón arquitectónico: feature-first (modular monolith) + event-driven

Cada módulo sigue siendo una unidad autocontenida (componentes, hooks, store, actions, tipos). Lo nuevo en v2: los módulos **no se llaman entre sí directamente** para efectos secundarios — se comunican emitiendo eventos de dominio. Ej: el módulo Content no importa código del módulo Notifications para avisar "te asignaron un contenido"; emite `content.assigned` y Notifications (como cualquier otro suscriptor) reacciona. Esto es lo que permite agregar Activity Log, Notifications, Trash, etc. sin tocar el código de los módulos de negocio existentes.

### 1.3 Multi-tenancy

Sin cambios respecto a v1: `Organization → Workspace (cliente/marca) → Membership (User↔Workspace, rol)`.

### 1.4 Data flow

```
Server Component (fetch inicial, RSC)
   → Client Component interactivo (Zustand + TanStack Query donde aplica)
        → Server Action (valida con Zod)
             → Servicio (/server/services/*) → Drizzle (bajo RLS, ver §1.5)
             → Dentro de la misma transacción: INSERT en event_log (outbox, ver §1.6)
             → Revalidación (revalidatePath/revalidateTag)
```

Autosave y Undo/Redo: sin cambios respecto a v1 (§1.4 original) — hook `useAutosave()` y `commandStack.ts` compartidos.

### 1.5 Seguridad: RLS como única fuente de verdad (resuelve v1 §6.2)

Con Drizzle es posible mantener tipado fuerte sin sacrificar RLS, usando este patrón:

- **Schema y políticas viven juntos**: `drizzle/schema.ts` define tablas y también las políticas RLS (`pgPolicy`, helpers de `drizzle-orm/supabase` como `authenticatedRole`, `authUid()`). `drizzle-kit generate` produce migraciones SQL que incluyen esas políticas — no hay un archivo de políticas separado que se pueda desincronizar del schema.
- **Ejecución de queries respetando RLS**: cada request autenticado abre una transacción Drizzle que primero hace `SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claims = '<jwt del usuario>'` (mismo mecanismo que usa PostgREST internamente) — así **todas** las queries, aunque pasen por Drizzle y no por el cliente `supabase-js`, son evaluadas por las mismas políticas RLS. Esto vive en un único helper `withRLS(request, callback)` en `/lib/db`, no se repite por módulo.
- **No hay capa de autorización paralela en `/server/services`**: a diferencia de v1, los servicios ya no verifican rol/permiso en TypeScript — solo arman la query; si el usuario no tiene permiso, Postgres devuelve 0 filas o error, y eso es la fuente de verdad.
- **Excepción explícita y acotada**: los *consumidores de eventos* que corren en background (ver §1.6 — ej. el handler que genera notificaciones) no tienen un usuario autenticado en contexto, así que usan un cliente Drizzle con el *service role* (bypass de RLS) **exclusivamente dentro de `/server/events/handlers`**, nunca en código alcanzable desde una request de usuario. Es la única puerta de bypass y queda auditada por convención de carpeta.
- **Permisos granulares (§1.8) también se resuelven en Postgres**: una función `has_permission(uid, workspace_id, perm_key)` es la que consultan las políticas RLS, así que agregar un permiso nuevo no requiere tocar código de aplicación, solo la matriz en la base de datos.

### 1.6 Arquitectura basada en eventos (Event Bus)

Dos mecanismos complementarios, no uno solo:

1. **Bus en memoria (`lib/events/bus.ts`)** — pub/sub síncrono dentro de un mismo request, para efectos que deben ocurrir ya (ej. invalidar una cache local). Es el "desacople de código", no de infraestructura.
2. **Outbox durable (`event_log`)** — cada Server Action que muta algo relevante inserta una fila en `event_log` **dentro de la misma transacción** que la mutación (si la mutación falla, el evento nunca se escribe — no hay eventos huérfanos). Un dispatcher (Supabase Edge Function en cron corto, o `LISTEN/NOTIFY` de Postgres) drena eventos no procesados e invoca a los handlers registrados para ese tipo de evento, marcándolos procesados. Este es el mecanismo que alimenta **Activity Log**, **Notifications**, actualización de **Timeline**, y en el futuro cualquier plugin externo (webhooks salientes).

Catálogo de eventos tipado en `lib/events/types.ts`, ej.: `content.status_changed`, `content.assigned`, `idea.converted`, `brief.approved`, `moodboard.element.created`, `comment.created`, `item.trashed`, `item.restored`. Cada módulo declara qué eventos emite y qué eventos consume — es la única forma de acoplamiento permitida entre módulos.

### 1.7 Arquitectura de plugins multi-plataforma

Hoy todo el dominio está modelado pensando solo en Instagram (formatos, métricas, grilla de feed). Para que mañana se pueda sumar TikTok/LinkedIn/etc. sin reescribir el core:

```ts
interface PlatformPlugin {
  id: string                          // 'instagram'
  name: string
  contentFormats: FormatDefinition[]  // reglas de cada formato (largo de copy, aspect ratio, límites)
  statFields: StatFieldDefinition[]   // qué métricas trackea esta plataforma
  FeedPreviewComponent: React.ComponentType<{ items: Content[] }>  // cómo se simula el feed
  validateContent(content: Content): ValidationResult
}
```

- `Content.platform` (default `'instagram'`) + `Content.platformData: jsonb` para campos específicos de cada plataforma, en vez de columnas fijas.
- Los formatos (`POST|REEL|CARRUSEL|HISTORIA`) dejan de ser un `enum` fijo de Postgres y pasan a validarse contra una tabla `platform_formats` (poblada por cada plugin) — sigue habiendo integridad referencial en la base de datos, pero agregar una plataforma es un `insert`, no una migración de schema.
- El "Constructor de Feed" de v1 se generaliza a **Platform Preview**: renderiza `plugin.FeedPreviewComponent`. Para v2/Fase actual solo se implementa el plugin de Instagram (grilla 3 columnas); el resto queda como interfaz preparada, igual que se pidió para IA.
- Registro en `/lib/plugins/registry.ts`, sin tabla de base de datos por ahora (registro en código, no dinámico) — es la opción correcta para un MVP; un marketplace de plugins de terceros sería una fase muy posterior, no la asumo salvo que la pidas.

### 1.8 Permisos granulares (además de roles)

```
Membership.role        → OWNER | ADMIN | EDITOR | VIEWER   (default grueso, sin cambios de v1)
Permission              → catálogo de acciones: content:create, content:delete, content:publish,
                           brief:approve, moodboard:edit, settings:manage, members:invite, stats:view...
RoleDefaultPermission    → matriz semilla: qué permisos trae cada rol por defecto
MembershipPermissionOverride → excepciones puntuales por usuario+workspace ("este Viewer sí puede aprobar briefs")
```

`has_permission(uid, workspace_id, key)` (función SQL) resuelve: override explícito → si no existe, default del rol. La misma función se usa (a) dentro de las políticas RLS (autorización real) y (b) vía una RPC liviana desde el cliente solo para decidir qué botones mostrar/ocultar en la UI — nunca como mecanismo de seguridad, solo de UX.

---

## 2. Estructura de carpetas propuesta

```
/app
  (auth)/login, /signup, /reset-password
  (app)/
    layout.tsx                    ← sidebar, topbar, command palette, panel derecho, notificaciones
    dashboard/page.tsx
    brief/page.tsx  brief/[briefId]/page.tsx      ← NUEVO: Brief de Contenido
    manual/[[...slug]]/page.tsx
    moodboard/[boardId]/page.tsx
    inspiration/page.tsx
    ideas/page.tsx
    content/page.tsx              (?view=galeria|calendario|lista|kanban|timeline)
    content/[contentId]/page.tsx
    calendar/page.tsx
    feed-builder/page.tsx         ← ahora "Platform Preview" genérico (§1.7)
    campaigns/[campaignId]/page.tsx
    resources/page.tsx
    copies/page.tsx
    competitors/[competitorId]/page.tsx
    stats/page.tsx
    activity/page.tsx             ← NUEVO: Activity Log
    notifications/page.tsx        ← NUEVO
    trash/page.tsx                ← NUEVO
    favorites/page.tsx            ← NUEVO
    templates/page.tsx            ← NUEVO
    settings/{workspace,members,tags,permissions,billing}/page.tsx
  api/webhooks/...

/features
  brief/  manual/  moodboard/  inspiration/  ideas/  content/  calendar/
  feed-builder/  campaigns/  resources/  copies/  competitors/  stats/
  activity-log/  notifications/  trash/  favorites/  templates/  recently-viewed/
  clients/  tags/  search/  ai/ (stubs)
  cada uno con: components/ hooks/ store/ actions/ types.ts

/components
  ui/  layout/ (incluye NotificationBell, TrashBanner, FavoriteToggle)  shared/

/lib
  db/            ← cliente Drizzle + helper withRLS() (§1.5)
  events/
    bus.ts        ← pub/sub en memoria
    types.ts       ← catálogo tipado de eventos
    dispatch.ts     ← escribe a event_log dentro de la transacción
  plugins/
    registry.ts
    types.ts
    instagram/      ← único plugin implementado hoy
  permissions/
    matrix.ts  check.ts
  validations/
  history/         ← command stack para undo/redo
  utils/

/server
  services/        ← lógica de dominio, arma queries (ya no autoriza, ver §1.5)
  events/handlers/  ← consumidores del outbox (Notifications, ActivityLog, Timeline, Trash purge...)
                      único lugar del código con cliente service-role (bypass RLS)

/drizzle
  schema.ts        ← tablas + políticas RLS + funciones SQL (has_permission, etc.)
  migrations/
  seed.ts

/stores  /types  /styles
/tests
  unit/ integration/ e2e/
```

---

## 3. Modelo de datos (borrador Drizzle, alto nivel)

Se mantienen del v1 sin cambios de fondo: `Organization, Workspace, User, Membership, ManualPage, Moodboard/MoodboardElement, InspirationItem, Content, ContentVersion, Asset, Campaign, Tag, Resource, Copy, Competitor, StatEntry, FeedSlot, AIJob` (ver v1 §3 para el detalle campo a campo — no se repite acá).

**Nuevo en v2:**

```
// --- Brief de Contenido (nuevo punto de partida del flujo creativo) ---
ContentBrief {
  id, workspaceId, campaignId?
  title, objective, targetAudience, keyMessage
  deliverables: jsonb        // ej. [{format:'reel', qty:3}, {format:'carrusel', qty:2}]
  references: jsonb          // InspirationItem[] relacionados
  deadline, status           // DRAFT | APPROVED | IN_PROGRESS | COMPLETED
  createdBy, notes
}
// Idea y Content ahora pueden trazar su origen:
Idea.briefId?      Content.briefId?

// --- Seguridad granular (§1.8) ---
Permission { key (PK), label, category }
RoleDefaultPermission { role, permissionKey }
MembershipPermissionOverride { membershipId, permissionKey, granted }

// --- Event Bus / outbox (§1.6) ---
EventLog {
  id, workspaceId, type, payload: jsonb
  actorId, entityType, entityId
  createdAt, processedAt?
}
// Activity Log NO es una tabla aparte: es una vista/consulta formateada sobre EventLog
// (evita duplicar datos que ya están en el outbox)

// --- Notifications ---
Notification { id, userId, workspaceId, type, payload: jsonb, entityType, entityId, readAt?, createdAt }

// --- Trash (soft delete transversal) ---
// No es tabla propia: se agrega `deletedAt: timestamp | null` a todo modelo "papelera-able"
// (Content, Idea, Moodboard, Resource, Campaign, ManualPage, ContentBrief).
// Todas las queries por defecto filtran deletedAt IS NULL (a nivel de política RLS, no en cada query manual).
// Un job programado purga (hard delete) lo que lleva > 30 días en deletedAt, emitiendo `item.purged`.

// --- Favorites ---
Favorite { id, userId, workspaceId, entityType, entityId, createdAt }  // unique(userId, entityType, entityId)

// --- Templates ---
Template { id, workspaceId, type, name, payload: jsonb, createdBy }   // type: CONTENT|IDEA|BRIEF|MANUAL_PAGE

// --- Recently Viewed ---
RecentlyViewed { id, userId, workspaceId, entityType, entityId, viewedAt }  // upsert por vista, rotación por cantidad

// --- Multi-plataforma (§1.7) ---
Content.platform: text (default 'instagram')
Content.platformData: jsonb
PlatformFormat { platform, formatKey, label, rules: jsonb }   // reemplaza el enum fijo de formatos
```

Notas de diseño v2:
- **Activity Log reutiliza `EventLog`** en vez de duplicar una tabla — es el mismo outbox que ya existe para el Event Bus, solo que la UI de Activity Log lo consulta y formatea de forma legible. Menos superficie de datos, una sola fuente de verdad para "qué pasó y cuándo".
- **Trash es un campo, no un módulo de datos separado** — más simple de mantener consistente (no hay que sincronizar una tabla "trashed items" con el resto).
- **Brief → Idea → Content** es trazable pero no obligatorio: se puede crear una Idea o un Content sin Brief (para flujos rápidos), el Brief es el punto de partida recomendado para trabajo de campaña/cliente, no un paso forzado.

---

## 4. Flujos UX clave (actualizado)

**Brief → Ideas → Contenido** *(nuevo flujo principal)*
```
Brief de Contenido (nuevo) → se define objetivo, audiencia, entregables esperados
  → "Generar ideas a partir de este brief" → crea N Ideas vinculadas (briefId)
  → cada Idea se convierte en Content como en v1 (trazabilidad hasta el Brief se conserva)
```

**Ciclo de vida de un Content** — sin cambios de v1: `IDEA → REVISION → DISEÑO → COPY → PROGRAMADO → PUBLICADO → ANALIZADO`, cada transición emite `content.status_changed` (ver §1.6) que alimenta Timeline, Activity Log y Notifications automáticamente — ya no hay que escribir código específico en cada uno de esos tres módulos.

**Notificaciones**
```
Evento relevante (asignación, mención, cambio de estado, comentario, brief aprobado)
  → handler en /server/events/handlers/notifications.ts crea Notification para el/los usuario(s) afectado(s)
  → campanita en topbar (badge de no leídas) → panel desplegable → click navega a la entidad
```

**Papelera**
```
Eliminar Content/Idea/Moodboard/... → soft delete (deletedAt = now()) + evento `item.trashed`
Vista Trash lista lo eliminado (por workspace) → Restaurar (deletedAt = null) o Eliminar definitivo
Purga automática > 30 días (job programado)
```

**Favoritos / Recientes**
```
Estrella en cualquier card de Content/Idea/Resource/Moodboard → Favorite toggle (optimista)
Toda apertura de detalle → upsert en RecentlyViewed → alimenta sidebar "Recientes" y ranking del Command Palette
```

Los flujos de Moodboard, Calendario, Constructor de Feed (ahora Platform Preview) y Command Palette se mantienen como en v1 §4.

---

## 5. Wireframes en texto (solo lo nuevo respecto a v1)

**Brief de Contenido**
```
┌ Brief: "Lanzamiento Primavera" ────────────────────────────┐
│ Objetivo:      [_________________________________]         │
│ Audiencia:     [_________________________________]         │
│ Mensaje clave: [_________________________________]         │
│ Entregables:   ▢ 3 Reels   ▢ 2 Carruseles   ▢ 5 Historias  │
│ Referencias:   [thumbnails de InspirationItem vinculados]   │
│ Deadline:      [fecha]              Estado: DRAFT ▾         │
│                                                              │
│              [ Generar ideas a partir de este Brief ]       │
└──────────────────────────────────────────────────────────────┘
```

**Topbar con Notifications + Favorites + Trash**
```
┌ Breadcrumbs ······················· 🔍 Buscar  ⌘K  ⭐Favoritos  🕐Recientes  🔔3  🗑️  👤 ┐
```

**Activity Log (por Content o por Workspace)**
```
Hoy
  10:32  María cambió el estado de "Reel lanzamiento" de Diseño → Copy
  09:15  Juan comentó en "Carrusel producto X"
Ayer
  18:02  Se aprobó el Brief "Lanzamiento Primavera"
```

El resto de los wireframes (shell general, galería, feed/platform preview, manual) se mantiene igual que v1 §5.

---

## 6. Problemas detectados — actualización v2

**6.1 — Scaffold roto (sin resolver, sigue igual que v1 §6.1).** Ver pregunta al cierre.

**6.2 — Prisma vs RLS → RESUELTO.** Se adopta Drizzle + RLS como única fuente de verdad, con el patrón de `withRLS()` descrito en §1.5. Ya no es un punto abierto.

**6.3 — Alcance del proyecto → mitigado por el roadmap reordenado (§8)**, que ahora prioriza infraestructura (incluye los 6 módulos transversales nuevos) antes que módulos de producto, evitando construir Notifications/Trash/etc. de forma ad hoc módulo por módulo más adelante.

**6.4 — Moodboard: persistencia y performance.** Sin cambios respecto a v1 §6.4 (virtualización de viewport desde el día uno).

**6.5 — Autosave + Undo/Redo transversal.** Sin cambios respecto a v1 §6.5.

**6.6 — Nuevo: consistencia del outbox.** Si un handler de eventos falla a mitad de camino (ej. Notifications sí corre pero Activity Log no), el evento debe quedar reintentable, no marcarse `processedAt` hasta que **todos** los handlers registrados para ese tipo confirmen. Hay que definir si el reintento es por evento completo o por (evento, handler) — recomiendo esto último (`event_handler_log` con estado por par) para que un handler lento/roto no bloquee a los demás. Lo dejo marcado para resolver en el diseño detallado de Fase 1, no bloquea la aprobación de este documento.

**6.7 — Nuevo: RLS + Drizzle en local/desarrollo.** El patrón `SET LOCAL request.jwt.claims` requiere que el entorno de desarrollo tenga Supabase (o un Postgres con las funciones `auth.*` emuladas) corriendo, no un Postgres genérico. Hay que documentar el setup local (Supabase CLI) como prerequisito de Fase 1 — lo agrego como tarea explícita del roadmap.

---

## 7. Mejoras propuestas — se mantienen las de v1 (§7.1 a §7.5), sin cambios.

---

## 8. Roadmap reordenado: Infraestructura → Producción → Creatividad → IA y optimización

| Fase | Contenido | Justificación |
|---|---|---|
| **1 — Infraestructura** | Supabase Auth + Workspaces/Organizations + RLS + permisos granulares (§1.8); schema Drizzle base y setup local (§6.7); Event Bus + `event_log` + primeros handlers; Plugin registry (solo plugin Instagram); shell (sidebar/topbar/command palette); **Activity Log, Notifications, Trash, Favorites, Recently Viewed** (los 5 módulos transversales — Templates se mueve a Fase 2 porque depende de que existan Content/Idea/Brief para tener algo que templatizar); Settings/Members | Todo lo demás depende de que seguridad, eventos y plugins existan desde el principio — construirlos después obligaría a tocar cada módulo de producto dos veces |
| **2 — Producción** | **Brief de Contenido** (nuevo punto de entrada), Banco de Ideas, Gestor de Contenido (todas las vistas), Calendario Editorial, Campañas, Timeline (ahora alimentado por eventos, no código ad hoc), **Templates** | Es el núcleo operativo diario: de brief a contenido publicado |
| **3 — Creatividad** | Manual Maestro (wiki), Moodboard, Biblioteca de Inspiración, Platform Preview (ex-Constructor de Feed), Recursos, Banco de Copies, Competencia | Módulos de mayor riqueza visual, se apoyan en Content/Resource ya existentes de Fase 2 |
| **4 — IA y optimización** | Estadísticas + gráficos, interfaz `AIAction` + `AIJob` (sin implementar), afinado de Command Palette/búsqueda, performance (virtualización Moodboard, code-splitting), accesibilidad, plugins de otras plataformas (opcional, a demanda) | Cierre de producto comercial premium sobre una base ya sólida |

---

## Quedan dos cosas pendientes, no de arquitectura sino operativas

1. **Scaffold roto existente** (README dice Supabase+RLS+13 tablas pero no hay código real, y hay rutas anidadas rotas) — ¿reconstruyo limpio, lo conservás, o lo revisás vos primero?
2. **Permiso de GitHub** — seguimos sin poder crear/pushear a la rama `claude/instagram-content-os-qmjhx8` (403 "Resource not accessible by integration"). Necesito que revises el permiso "Contents: Read & Write" de la integración para este repo, o que crees la rama vacía desde `main` vos misma.

Con esas dos respuestas empiezo la Fase 1.
