# CM OS PRO — Content Operating System para Instagram
## Documento de Arquitectura y Planificación (v3 — Fase 1 completada y aprobada)

> v3 documenta lo que realmente se construyó en Fase 1 (no solo lo planeado), con los bugs encontrados y cómo se verificaron, y agrega la propuesta de Brief como documento vivo para Fase 2 (pendiente de aprobación). El desarrollo funcional está **pausado por decisión explícita** hasta resolver el sync con GitHub — ver "Estado actual" abajo.

---

## Estado actual (30/07/2026)

- **Fase 1 (Infraestructura): completada y aprobada.** Todo lo listado en §9 está commiteado en la rama `claude/instagram-content-os-qmjhx8`.
- **Bloqueante activo: la rama no está sincronizada con GitHub.** `git push` y la API de GitHub devuelven `403 Resource not accessible by integration` al intentar crear la rama — la integración de Claude Code con esta cuenta de GitHub no tiene permiso de escritura. Se probaron todas las vías de autoservicio (permisos del repo, cuenta de GitHub, conectores de Claude, desconectar/reconectar) sin éxito; requiere que soporte de Anthropic lo habilite del otro lado.
- **Desarrollo funcional pausado** a pedido explícito hasta que el push funcione — la prioridad es no acumular más fases sin historial remoto verificable. Mientras tanto solo se hacen tareas de documentación, arquitectura o mejoras menores (esta actualización es una de ellas).
- **Fase 2 (Producción):** arranca con el Brief de Contenido. Hay una propuesta de rediseño (documento vivo tipo Notion, no formulario — ver §4.1) **pendiente de aprobación**, todavía sin implementar.

---

## 0. Auditoría del estado del repositorio — resuelto

El scaffold roto original (README desalineado, rutas anidadas rotas, sin `package.json` real) se descartó por completo y se reconstruyó desde cero — decisión aprobada explícitamente. Ver §9 para el detalle de lo que se construyó en su lugar.

---

## 1. Arquitectura

### 1.1 Stack

| Capa | Elección | Estado |
|---|---|---|
| Framework | **Next.js 15.5.22** (App Router) + React 19 + TypeScript estricto | ✅ Implementado |
| UI | Tailwind CSS v4 + shadcn/ui | ✅ Implementado — componentes escritos a mano (`components/ui/`): `ui.shadcn.com` está bloqueado por la política de red de este entorno, así que no se pudo usar el CLI. Mismo código fuente (Radix + `class-variance-authority` + `cn()`) que generaría, con `components.json` listo por si en otro entorno sí funciona `npx shadcn add` |
| Tipografía | **Geist** (UI funcional) + **Fraunces** itálica (títulos y momentos editoriales) | ✅ Implementado — decisión de diseño tomada al construir el shell: Geist para todo lo funcional (nav, botones, tablas), Fraunces reservada a headlines para lograr "tipografía protagonista" sin tocar color (paleta se mantiene neutra en ambos temas) |
| Animación | Framer Motion | ⏳ Instalado, sin uso todavía (Fase 1 no tuvo módulos que lo necesitaran) |
| Estado cliente | Zustand por módulo | ⏳ Instalado, sin uso todavía |
| Estado servidor/cache | TanStack Query | ⏳ Instalado, sin uso todavía — Fase 1 es toda RSC + Server Actions |
| **ORM** | **Drizzle ORM + drizzle-kit** | ✅ Implementado y verificado contra Postgres real (ver §9.2) |
| Base de datos | PostgreSQL (Supabase) | ✅ Schema completo de Fase 1 migrado y probado localmente; sin proyecto Supabase real conectado todavía (sin credenciales en este entorno) |
| **Seguridad** | Supabase Auth + PostgreSQL RLS como única fuente de verdad | ✅ Implementado — ver §1.5 y §9.2 (incluye dos bugs de RLS reales encontrados y corregidos) |
| Storage de archivos | Supabase Storage | ⏳ Sin implementar (no hay módulos con archivos todavía) |
| **Event Bus** | Emisor interno + `event_log` (outbox) + `event_handler_log` (tracking por handler) | ✅ Implementado y verificado end-to-end (dispatch → outbox → drain → handler → notificación) |
| **Plugins** | Registro de plataformas en código (`PlatformPlugin`) | ✅ Implementado — solo plugin de Instagram, `FeedPreviewComponent` mínimo |
| Editor enriquecido | TipTap | ⏳ Sin instalar todavía — se adelanta a Fase 2 (ver §4.1, lo necesita el Brief) |
| Canvas infinito | React Flow | ⏳ Fase 3 |
| Drag & drop general | @dnd-kit | ⏳ Instalado, sin uso todavía |
| Calendario | React Big Calendar | ⏳ Fase 2 |
| Validación | Zod | ✅ Implementado (Server Actions de Auth y Settings/Members) |
| Testing | Vitest + Testing Library + Playwright | ⏳ Playwright se usó para verificación visual manual (screenshots, video) durante el desarrollo, no hay suite de tests automatizada todavía |

### 1.2 Patrón arquitectónico — sin cambios de v2

Feature-first + event-driven. Los módulos de Fase 1 (Settings/Members, Notifications, Activity Log) ya siguen este patrón: `members-actions.ts` dispara `membership.created`, y Notifications/Activity Log lo consumen sin que el módulo de Members sepa que existen.

### 1.3 Multi-tenancy — implementado con una simplificación conocida

`Organization → Workspace → Membership` está implementado y con RLS verificado. **Simplificación de Fase 1:** no hay selector de workspace activo persistido (cookie/URL) todavía — todas las páginas usan `getPrimaryWorkspace()` (el primer workspace del usuario). El dropdown de workspace en el sidebar es decorativo por ahora. Se resuelve cuando haga falta soportar multi-workspace real (probablemente Fase 2 o 3, a demanda).

### 1.4 Data flow — sin cambios de v2, implementado

El flujo `Server Component → Server Action (Zod) → Servicio → Drizzle (withRLS) → event_log → revalidatePath` está en uso real en Settings/Members. Autosave y Undo/Redo compartidos: siguen sin implementarse (no hubo todavía un módulo con contenido editable de forma continua — el Brief como documento vivo va a ser el primero, ver §4.1).

### 1.5 Seguridad: RLS como única fuente de verdad — implementado y verificado

El patrón descrito en v2 (`withRLS()`/`withServiceRole()` en `lib/db/index.ts`, políticas declaradas junto al schema) está implementado tal cual se diseñó. Verificación real hecha en Fase 1 (no solo tipos):

- Un usuario sin membership no ve workspaces/memberships/organizations ajenos.
- Un `VIEWER` intentando `UPDATE` sobre `workspaces` afecta 0 filas (bloqueado por RLS, no por lógica de aplicación).
- `has_permission()` resuelve overrides antes que default de rol, verificado con casos reales.

**Dos bugs reales encontrados corriendo la migración contra Postgres real** (no se habrían detectado solo revisando el SQL generado) — ver §9.2 para el detalle técnico completo:
1. `has_permission()` está en `LANGUAGE sql`, que valida a la creación que las tablas referenciadas existan — estaba antes de los `CREATE TABLE` en la migración generada.
2. La política de `memberships` se auto-consultaba a sí misma → recursión infinita real en Postgres al ejecutar la query (no al aplicar la migración).

### 1.6 – 1.8 (Event Bus, Plugins, Permisos granulares) — sin cambios de diseño, implementados

Ver §9.2 para el detalle de qué se implementó de cada uno en Fase 1 vs. qué queda para cuando existan módulos de producto que los necesiten (ej. `content.status_changed` recién se suma cuando exista `Content`).

---

## 2. Estructura de carpetas — implementada con una desviación deliberada

La estructura real terminó sin la carpeta `/features` que proponía v2. En su lugar:
- `/server/services` — lógica de datos (lo que v2 llamaba servicios dentro de cada feature)
- Componentes de una página específica (ej. `member-row.tsx`, `invite-form.tsx`) **colocados junto a la ruta** en `/app/(app)/settings/`, siguiendo la convención estándar de Next.js App Router, en vez de vivir en un árbol `/features` separado
- `/components/layout`, `/components/ui`, `/components/shared` — sin cambios respecto a lo planeado

Es una simplificación razonable para el tamaño actual del proyecto; si en Fase 2/3 la colocation empieza a sentirse desordenada con más módulos, se puede introducir `/features` en ese momento sin romper lo ya escrito.

Resto de la estructura (`/lib`, `/drizzle`, `/server`) tal como se planeó en v2 §2.

---

## 3. Modelo de datos — Fase 1 implementada, Brief actualizado (propuesta)

### 3.1 Fase 1 (implementado, ver migraciones `drizzle/migrations/0000_*` y `0001_*`)

`organizations, workspaces, profiles, memberships, permissions, role_default_permissions, membership_permission_overrides, event_log, event_handler_log, notifications, favorites, recently_viewed, platform_formats` — esquema completo tal como se diseñó en v2 §3, con el agregado de `event_handler_log` (no estaba en v2, resuelve §6.6 con tracking por par evento+handler) y el trigger `handle_new_user()` (crea `profiles` automáticamente al registrarse, patrón estándar de Supabase que faltaba en el diseño original).

### 3.2 Brief de Contenido — REDISEÑADO (pendiente de aprobación, Fase 2)

El diseño de v2 (`ContentBrief` con columnas fijas `objective`/`targetAudience`/`keyMessage`/`notes`) queda **reemplazado** por esta propuesta, todavía sin implementar:

```
ContentBrief {
  id, workspaceId, campaignId?
  icon?, title, status, deadline?
  deliverables: jsonb        // [{format, qty}] — la única parte "estructurada"
  contentJson: jsonb         // documento TipTap: objetivo, audiencia, mensaje, referencias, notas — todo mezclado
  createdBy, deletedAt?
}
```

Motivo: v2 modelaba el Brief como formulario tradicional (un campo de texto por concepto). El brief para Fase 2 pide explícitamente que se sienta como un documento vivo tipo Notion, no un formulario — así que el contenido narrativo pasa a vivir en un documento TipTap único (como ya se planeaba para el Manual Maestro), con solo un puñado de propiedades estructuradas arriba (estado, fecha límite, entregables), al estilo de la barra de propiedades de una página de Notion. Esto adelanta la infraestructura de TipTap de Fase 3 a Fase 2. Detalle completo de la propuesta de UX en §4.1.

Las referencias a la Biblioteca de Inspiración (Fase 3) quedan como embeds dentro del documento por ahora, no como relación estructurada — esa se suma cuando exista el módulo de Inspiración.

---

## 4. Flujos UX

### 4.1 Brief como documento vivo — PROPUESTA PENDIENTE DE APROBAR (Fase 2)

No implementado todavía. Diseño propuesto:

- **Barra de propiedades arriba** (estilo Notion): ícono/emoji opcional, título grande editable inline, y unas pocas propiedades cortas — Estado (Draft/Aprobado/En progreso/Completado), Fecha límite, Campaña opcional, Entregables (chips tipo "3 Reels · 2 Carruseles", se agregan/quitan).
- **Cuerpo del documento — editor TipTap completo** debajo. Objetivo, audiencia, mensaje clave, referencias, notas: todo vive ahí, organizado libremente (headings, checklists, imágenes, links), no en inputs separados. Un Brief nuevo arranca con headings sugeridos (`## Objetivo`, `## Audiencia`, `## Mensaje clave`) como punto de partida editable, no como campos obligatorios.
- Autosave con debounce, igual que el resto del producto (que todavía no tiene ningún módulo con autosave implementado — este sería el primero).
- Botón "Generar ideas a partir de este Brief" — crea Ideas vinculadas (`briefId`), sin IA (el usuario las completa a mano en el Banco de Ideas).
- `/brief` como lista tipo Notion: título, estado, fecha límite, extracto del documento.

Trae como consecuencia de arquitectura: TipTap se instala en Fase 2 (no Fase 3) como infraestructura compartida en `components/editor/`, para que el Manual Maestro la reutilice después.

### 4.2 Resto de los flujos — sin cambios de v2, pendientes de Fase 2/3

Ciclo de vida de Content, Notificaciones (el mecanismo de notificación en sí ya está implementado en Fase 1, ver §9.2 — falta el productor `content.status_changed` que no existe hasta que exista `Content`), Papelera, Favoritos/Recientes (modelo de datos y queries ya implementados en Fase 1 con resultado vacío honesto; falta qué favoritear/ver), Moodboard, Calendario, Constructor de Feed, Command Palette: sin cambios respecto a v2 §4, todos pendientes de Fase 2/3.

---

## 5. Wireframes — sin cambios de v2 para lo pendiente

Los wireframes de v2 (shell general, galería, feed, manual, Brief como formulario) siguen documentando la intención general, excepto el de Brief, que queda obsoleto por §4.1 — no se rehace el ASCII-art acá, la propuesta de texto en §4.1 ya lo reemplaza conceptualmente.

El shell general SÍ está implementado (sidebar agrupado en 3 secciones, topbar con búsqueda/tema/notificaciones/avatar, Command Palette) — ver capturas y video compartidos durante el desarrollo.

---

## 6. Problemas detectados — actualización v3

**6.1 — Scaffold roto → RESUELTO** (v2 §6.1). Reconstruido desde cero.

**6.2 — Prisma vs RLS → RESUELTO** (v2). Sin cambios.

**6.3 — Alcance del proyecto → mitigado**, sin cambios de v2.

**6.4 — Moodboard: persistencia y performance.** Sigue pendiente, sin cambios (Fase 3).

**6.5 — Autosave + Undo/Redo transversal.** Sigue sin implementarse — el Brief (§4.1) va a ser el primer caso real, ahí se construye el hook compartido en vez de en abstracto.

**6.6 — Consistencia del outbox → RESUELTO en Fase 1.** Se implementó `event_handler_log` con tracking por (evento, handler) tal como se recomendaba en v2. Verificado con un handler real (`notifyOnMembershipCreated`).

**6.7 — RLS + Drizzle en local/desarrollo → RESUELTO.** Se documentó y probó levantando Postgres local con un schema `auth` mínimo (tabla `auth.users` + función `auth.uid()` + roles `anon`/`authenticated`/`service_role`/`authenticator`) que emula lo suficiente de Supabase para correr las migraciones y probar RLS de verdad sin necesitar un proyecto Supabase real. No quedó documentado como script reproducible todavía — es una mejora pendiente (ver §7.6).

**6.8 — Nuevo: sin proyecto Supabase real conectado.** Todo lo de Fase 1 se verificó contra un Postgres local con un shim de `auth.*`, no contra Supabase real. Login/signup/invitación por email están implementados pero no probados end-to-end — falta que exista un proyecto Supabase real con credenciales para confirmar que el flujo completo funciona (especialmente `auth.admin.inviteUserByEmail`, que no se pudo ejercitar).

**6.9 — Nuevo: selector de workspace activo no funcional.** Ver §1.3 — el dropdown existe visualmente pero no cambia el workspace activo. No bloqueante mientras el producto solo se prueba con un workspace por usuario.

---

## 7. Mejoras propuestas — v1 §7.1-7.5 sin cambios, agrego:

**7.6 — Nuevo: script reproducible de setup local.** El Postgres local con shim de `auth.*` usado para verificar Fase 1 (§6.7) se armó a mano durante el desarrollo. Convendría convertirlo en un script (`scripts/setup-local-db.sh` o similar) para que cualquiera pueda levantar el mismo entorno de verificación sin depender de Supabase CLI ni de un proyecto real — sobre todo útil mientras no haya credenciales de un proyecto Supabase real disponibles.

---

## 8. Roadmap

| Fase | Contenido | Estado |
|---|---|---|
| **1 — Infraestructura** | Auth + Workspaces + RLS + permisos granulares; schema Drizzle; Event Bus + outbox; Plugin registry (Instagram); shell; Activity Log, Notifications, Favorites, Recently Viewed; Settings/Members | ✅ **Completada y aprobada.** Trash quedó sin UI (no hay nada que archivar todavía, ver §9.1) |
| **2 — Producción** | Brief de Contenido (rediseño §4.1, pendiente de aprobar), Banco de Ideas, Gestor de Contenido, Calendario Editorial, Campañas, Timeline, Templates | ⏸️ **Pausada** — desarrollo funcional suspendido hasta resolver el sync con GitHub (ver "Estado actual") |
| **3 — Creatividad** | Manual Maestro, Moodboard, Biblioteca de Inspiración, Platform Preview, Recursos, Banco de Copies, Competencia | Sin empezar |
| **4 — IA y optimización** | Estadísticas, `AIAction`/`AIJob`, búsqueda avanzada, performance, accesibilidad | Sin empezar |

---

## 9. Registro de implementación — Fase 1

### 9.1 Qué se construyó (18 commits, rama `claude/instagram-content-os-qmjhx8`)

1. Bootstrap Next.js 15 + TypeScript + Tailwind v4 + estructura de carpetas
2. Kit de shadcn/ui escrito a mano + tema claro/oscuro (`next-themes`)
3. Schema de Drizzle Fase 1 completo + RLS + migración
4. **Fix de 2 bugs de RLS reales** (§1.5) encontrados corriendo contra Postgres real
5. Tipografía Geist + Fraunces
6. Auth de Supabase (login/signup, middleware, `withRLS` claims) — sin probar contra proyecto real
7. Shell: sidebar agrupado, topbar, Command Palette (⌘K)
8. Trigger de perfil automático (`handle_new_user`)
9. Settings/Members: invitar, cambiar rol, quitar miembro, UI gateada por `has_permission()` real
10. Notifications (campanita + no leídas) + Activity Log (feed por día)
11. **Fix de un bug de copy real**: el texto de actividad confundía actor con sujeto ("Noelia se sumó" en vez de "Noelia agregó a X") — detectado revisando una captura de pantalla, no el código
12. Favoritos / Recientes conectados a queries reales (vacías, honestamente — no hay qué favoritear todavía)

### 9.2 Cómo se verificó (metodología, no solo tipos)

Se levantó Postgres 16 local con un schema `auth` mínimo (tabla `auth.users`, función `auth.uid()`, roles `anon`/`authenticated`/`service_role`/`authenticator`) que emula lo necesario de Supabase para que RLS funcione de verdad. Contra esa base se corrieron las migraciones reales y se probó, con datos reales (no mocks):

- Aislamiento de RLS entre usuarios (workspace/membership/organization).
- `has_permission()` con overrides y defaults de rol.
- El pipeline completo del Event Bus: `dispatchEvent()` → `event_log` → `drainEvents()` → handler → `notifications`.
- Los propios helpers `withRLS()`/`withServiceRole()` de la aplicación (no solo SQL crudo).
- El shell visual completo (sidebar, topbar, Command Palette, Settings con miembros reales, Activity Log) vía capturas de pantalla y un video grabado con Playwright navegando la app real.

Esta metodología — no confiar en que el SQL generado o los tipos de TypeScript sean correctos, sino ejecutarlo contra una base real — es lo que encontró los 3 bugs reales documentados en §1.5 y §9.1.

### 9.3 Qué falta para considerar Fase 1 100% end-to-end

- Proyecto Supabase real conectado (sin credenciales en este entorno) — para probar login/signup/invitación por email de punta a punta.
- Selector de workspace activo funcional (§6.9).
- Overrides de permisos granulares por usuario individual (el modelo existe, falta la UI en Settings).
- Script reproducible del setup local de verificación (§7.6).

---

## Bloqueante activo

**Sync con GitHub.** `git push` y la API de GitHub devuelven `403 Resource not accessible by integration` de forma consistente, incluso después de desconectar y reconectar la integración de GitHub tanto desde GitHub como desde Claude. No es un permiso configurable desde la cuenta de GitHub ni desde los Conectores de Claude — necesita que soporte de Anthropic lo habilite. El desarrollo funcional de Fase 2 está pausado hasta que esto se resuelva, por decisión explícita: se prefiere no acumular más fases solo en local.
