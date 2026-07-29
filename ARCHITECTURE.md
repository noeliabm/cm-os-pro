# CM OS PRO — Content Operating System para Instagram
## Documento de Arquitectura y Planificación (Fase 0 — pendiente de aprobación)

> Este documento cubre los puntos 1-7 solicitados: arquitectura, estructura de carpetas, modelo de datos, flujos UX, wireframes en texto, problemas detectados y mejoras propuestas. **No se ha escrito código de producto todavía** — solo se documenta el estado actual del repo, que ya existía antes de esta tarea.

---

## 0. Auditoría del estado actual del repositorio

Antes de proponer nada, esto es lo que ya existe en `main` / esta rama:

```
README.md                (describe stack: Next.js 14 + Supabase + React Query + @dnd-kit,
                           dice "13 tablas con RLS configuradas" y "Fase 4: Infra Setup")
app/page.tsx              → importa components/dashboard/Dashboard (el archivo NO existe en esa ruta)
app/test/page.tsx         → página de test que consulta Supabase (workspaces/users/clients)
app/test/app/api/test/components/dashboard/Dashboard.tsx   ← ruta anidada rota
app/test/app/api/test/route.ts                              ← idem
```

No hay `package.json`, `tsconfig.json`, `next.config`, `prisma/schema.prisma`, ni `lib/supabase.ts`. Es decir: **el proyecto no arranca hoy**. El README describe un estado (Supabase + RLS + 13 tablas) que no está presente en el código. Esto está detallado en la sección "Problemas detectados" (§6) con una decisión que necesito que tomes antes de tocar nada.

---

## 1. Arquitectura propuesta

### 1.1 Stack (con una decisión pendiente sobre BD/Auth — ver §6.2)

| Capa | Elección | Motivo |
|---|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript estricto | SSR/RSC para vistas pesadas de datos, Server Actions para mutaciones sin API boilerplate |
| UI | Tailwind CSS + shadcn/ui (Radix) | Look Notion/Linear, accesible, theming claro/oscuro nativo vía CSS vars |
| Animación | Framer Motion | Transiciones de panel, drag feedback, layout animations |
| Estado cliente | Zustand (por módulo: `moodboardStore`, `feedBuilderStore`, `paletteStore`...) | Estado local complejo (canvas, feed builder) sin boilerplate |
| Estado servidor/cache | TanStack Query, solo donde hay fetching client-heavy (moodboard, feed builder, kanban con drag optimista) | El resto usa RSC + Server Actions directamente, evitando duplicar cache |
| ORM | Prisma | Tipado end-to-end, migraciones versionadas, mejor DX que SQL crudo |
| Base de datos | PostgreSQL (hosteada en Supabase) | Mantiene lo ya elegido en el README; ver §6.2 para la reconciliación con RLS |
| Auth | Supabase Auth | Ya está contemplado en el proyecto original, evita reinventar sesiones/roles |
| Storage de archivos | Supabase Storage (propuesta: reemplaza a UploadThing — ver §7.1) | Ya integrado con Supabase Auth, evita un proveedor extra |
| Editor enriquecido | TipTap | Pedido explícitamente, ideal para el Manual Maestro tipo wiki |
| Canvas infinito | React Flow (custom nodes, sin edges de flujo real) | Pedido explícitamente, para Moodboard |
| Drag & drop general | @dnd-kit (propuesta: reemplaza a React DnD — ver §7.2) | Ya presente en el README original, más liviano y mantenido activamente |
| Calendario | React Big Calendar | Pedido explícitamente |
| Grillas reordenables | @dnd-kit sortable + CSS grid (propuesta: reemplaza react-grid-layout para el Feed Builder — ver §7.3); `react-grid-layout` se reserva para widgets del Dashboard | Ver justificación en mejoras |
| Validación | Zod (compartido cliente/servidor) | Single source of truth para formularios y Server Actions |
| Testing | Vitest + Testing Library + Playwright (E2E de flujos clave) | Cobertura de lógica + regresión visual de flujos críticos |

### 1.2 Patrón arquitectónico: **feature-first (modular monolith)**

En vez de organizar por capa técnica (`/components`, `/hooks`, `/services` como carpetas planas gigantes), cada módulo de negocio (Moodboard, Calendario, Ideas, etc.) es una unidad autocontenida con sus propios componentes, hooks, store, actions y tipos. Es el patrón que usan Linear/Notion internamente y escala mejor que MVC plano cuando hay 15+ módulos.

### 1.3 Multi-tenancy

```
Organization (agencia / usuario freelance)
   └─ Workspace = "Cliente/Marca" (1 Manual Maestro, 1 Moodboard, 1 calendario, etc.)
        └─ Membership (User ↔ Workspace, rol: OWNER | ADMIN | EDITOR | VIEWER)
```

Todo el contenido cuelga de `workspaceId`. El selector de cliente en la topbar cambia el `workspaceId` activo (guardado en cookie/URL, no solo en estado cliente, para que los enlaces sean compartibles).

### 1.4 Data flow

```
Server Component (fetch inicial, RSC)
   → Client Component interactivo (Zustand + TanStack Query para mutaciones optimistas)
        → Server Action (valida con Zod, autoriza por workspace+rol, llama a capa de servicio)
             → Servicio (lib/server/services/*) → Prisma → Postgres
             → Revalidación (revalidatePath/revalidateTag) + evento de Timeline si aplica
```

Autosave: debounce (800ms) sobre Server Actions idempotentes; cada módulo con contenido editable (TipTap, formularios de Idea/Content) comparte un hook `useAutosave()` con estado visual "Guardando… / Guardado".

Undo/Redo: patrón Command compartido (`lib/history/commandStack.ts`) usado por Moodboard y por el editor de contenido — no implementaciones ad hoc por módulo.

---

## 2. Estructura de carpetas propuesta

```
/app
  (auth)/login, /signup, /reset-password
  (app)/                          ← shell autenticado (sidebar+topbar+panel contextual)
    layout.tsx                    ← sidebar, topbar, command palette, panel derecho
    dashboard/page.tsx
    manual/[[...slug]]/page.tsx   ← wiki con rutas anidadas
    moodboard/[boardId]/page.tsx
    inspiration/page.tsx
    ideas/page.tsx
    content/page.tsx              ← vista principal (galería/calendario/lista/kanban/timeline via ?view=)
    content/[contentId]/page.tsx  ← detalle (o modal interceptor @modal)
    calendar/page.tsx
    feed-builder/page.tsx
    campaigns/[campaignId]/page.tsx
    resources/page.tsx
    copies/page.tsx
    competitors/[competitorId]/page.tsx
    stats/page.tsx
    settings/{workspace,members,tags,billing}/page.tsx
  api/webhooks/... (solo integraciones externas, no CRUD interno)

/features                         ← lógica de negocio por módulo
  moodboard/
    components/ (Canvas, StickyNote, Connector, LayerPanel...)
    hooks/ (useCanvasZoom, useSelection, useElementDrag)
    store/ (moodboard.store.ts — Zustand)
    actions/ (moodboard.actions.ts — Server Actions)
    types.ts
  manual/  ideas/  content/  calendar/  feed-builder/  campaigns/
  resources/  copies/  competitors/  stats/  clients/  tags/  search/  ai/ (stubs)

/components
  ui/         ← shadcn primitives (button, dialog, popover...)
  layout/     ← Sidebar, Topbar, CommandPalette, ContextPanel, Breadcrumbs
  shared/     ← EmptyState, ConfirmDialog, TagPicker, FileDropzone, StatusBadge...

/lib
  db.ts (Prisma client singleton)
  auth/ (sesión, helpers de rol)
  validations/ (esquemas Zod compartidos)
  history/ (command stack para undo/redo)
  utils/

/server
  services/  ← lógica de dominio pura, testeable, independiente de Next
  authz.ts   ← chequeo de rol/workspace centralizado

/prisma
  schema.prisma
  migrations/
  seed.ts

/stores            ← stores Zustand globales (paleta de comandos, tema, workspace activo)
/types             ← tipos compartidos entre features
/styles
/tests
  unit/ integration/ e2e/
```

---

## 3. Modelo de datos (borrador Prisma, alto nivel)

```prisma
model Organization { id, name, plan, createdAt, workspaces Workspace[] }

model Workspace {                       // = "Cliente" del Panel de Clientes
  id, organizationId, name, slug, logoUrl, brandColor
  members       Membership[]
  manualPages   ManualPage[]
  moodboards    Moodboard[]
  ideas         Idea[]
  contents      Content[]
  campaigns     Campaign[]
  resources     Resource[]
  copies        Copy[]
  competitors   Competitor[]
  tags          Tag[]
}

model User { id, email, name, avatarUrl, memberships Membership[] }
model Membership { id, userId, workspaceId, role  // OWNER|ADMIN|EDITOR|VIEWER
  @@unique([userId, workspaceId]) }

// --- Manual Maestro (wiki) ---
model ManualPage {
  id, workspaceId, parentId?, title, icon, order
  contentJson    Json          // documento TipTap (ProseMirror JSON)
  children       ManualPage[]  @relation("PageTree")
}

// --- Moodboard (canvas infinito) ---
model Moodboard { id, workspaceId, name, elements MoodboardElement[] }
model MoodboardElement {
  id, moodboardId, type          // IMAGE|NOTE|SHAPE|CONNECTOR|TEXT|EMBED|VIDEO|PDF
  x, y, width, height, rotation, zIndex
  locked Boolean, groupId String?
  data   Json                    // payload específico por tipo (url, color, texto, puntos del conector...)
}

// --- Biblioteca de Inspiración ---
model InspirationItem {
  id, workspaceId, type          // POST|REEL|CARRUSEL|HISTORIA|FOTO|TIPOGRAFIA|PALETA|MOCKUP|COMPETENCIA
  thumbnailUrl, title, description, sourceUrl, notes, createdAt
  tags TagOnInspiration[]
}

// --- Banco de Ideas ---
model Idea {
  id, workspaceId, title, description, objective, pillarTagId, formatTagId
  status         IdeaStatus      // BACKLOG|APPROVED|DISCARDED
  priority       Priority        // LOW|MEDIUM|HIGH
  assigneeId, dueDate, checklist Json, notes
  inspirations   InspirationOnIdea[]
  convertedContentId String?     // set cuando se convierte en Content
}

// --- Gestor de Contenido (núcleo) ---
model Content {
  id, workspaceId, campaignId?, title, description, objective
  copy, cta, hashtags String[]
  format         ContentFormat   // POST|REEL|CARRUSEL|HISTORIA
  pillarTagId, status ContentStatus // IDEA|REVISION|DISENO|COPY|PROGRAMADO|PUBLICADO|ANALIZADO
  scheduledAt, publishedAt
  assigneeId, notes
  files          Asset[]
  links          Json
  versions       ContentVersion[]
  tags           TagOnContent[]
  timelineEvents TimelineEvent[]
  stats          StatEntry[]
  feedSlot       FeedSlot?
}
model ContentVersion { id, contentId, snapshot Json, createdAt, createdById }
model Asset { id, contentId?, resourceId?, moodboardElementId?, url, type, name, sizeBytes }

model Campaign { id, workspaceId, name, startDate, endDate, contents Content[] }

// --- Etiquetas: dos taxonomías independientes ---
model Tag { id, workspaceId, name, color, scope TagScope } // FORMAT|PILLAR|CUSTOM
model TagOnContent { contentId, tagId }
model TagOnInspiration { inspirationId, tagId }

// --- Recursos ---
model Resource { id, workspaceId, type, url, name, tags Json, folderId? }

// --- Banco de Copies ---
model Copy { id, workspaceId, category, text, tags Json } // VENTAS|EDUCACION|ENTRETENIMIENTO|STORYTELLING|FAQ|CTA|PROMOCIONES|INSPIRACION

// --- Competencia ---
model Competitor { id, workspaceId, name, instagramUrl, tiktokUrl, facebookUrl, website
  screenshots CompetitorScreenshot[], notes CompetitorNote[], postingFrequency }

// --- Estadísticas (manuales por ahora) ---
model StatEntry { id, contentId, reach, likes, comments, saves, shares, views, followersDelta, engagementRate, recordedAt }

// --- Timeline automático ---
model TimelineEvent { id, contentId, fromStatus, toStatus, actorId, createdAt }

// --- Feed Builder ---
model FeedSlot { id, workspaceId, contentId, position, hidden Boolean }

// --- Preparado para IA (sin implementar) ---
model AIJob { id, workspaceId, type, inputJson, outputJson?, status, createdAt }
```

Notas de diseño:
- **Dos sistemas de etiquetas** se modelan como un único `Tag` con `scope` (`FORMAT`, `PILLAR`, `CUSTOM`) en vez de dos tablas separadas — mismo comportamiento de UI, menos duplicación de código de filtros/búsqueda.
- **Timeline** no es una tabla que el usuario edita: se inserta un `TimelineEvent` automáticamente en el Server Action que cambia `Content.status`.
- **Idea → Content**: la conversión copia campos y guarda `convertedContentId` en la Idea (trazabilidad), no se borra la idea original.

---

## 4. Flujos UX clave

**Idea → Contenido**
```
Banco de Ideas (vista Notion) → click "Convertir en contenido"
  → modal de mapeo (¿qué campos copiar?) → crea Content en estado IDEA
  → redirige a /content/[id] con TimelineEvent inicial registrado
```

**Ciclo de vida de un Content (Kanban/Timeline)**
```
IDEA → REVISION → DISEÑO → COPY → PROGRAMADO → PUBLICADO → ANALIZADO
```
Cada transición: drag en Kanban o botón en el detalle → Server Action → valida rol → inserta TimelineEvent → revalida vistas (Kanban, Calendario, Dashboard).

**Moodboard**
```
Doble click en canvas vacío → menú "Nota / Imagen / Forma / Texto"
Arrastrar archivo desde el SO → sube a Storage → crea MoodboardElement tipo IMAGE en la posición del drop
Selección múltiple (marquee) → agrupar/alinear/bloquear → toolbar contextual flotante
Zoom con scroll+ctrl, pan con espacio+drag (estándar Miro/Figma)
```

**Calendario Editorial**
```
Drag de un Content entre días → Server Action actualiza scheduledAt → optimistic update (TanStack Query)
Botón derecho sobre evento → Duplicar / Cambiar estado / Eliminar (menú contextual)
```

**Constructor de Feed**
```
Grid 3 columnas con todos los Content PROGRAMADO/PUBLICADO ordenados por FeedSlot.position
Drag & drop reordena → recalcula position de todos los slots afectados
Toggle "ocultar" no borra el Content, solo hidden=true en FeedSlot (no aparece en la simulación)
```

**Command Palette (Ctrl+K)**
```
Búsqueda difusa sobre: Content, Idea, Client, Tag, Resource, Copy (índice server-side con Postgres full-text
o Meilisearch/Typesense si el volumen lo justifica — decisión diferida, no bloqueante para el MVP)
```

---

## 5. Wireframes en texto

**Shell general**
```
┌─ Sidebar ──┬───────────────── Topbar: breadcrumbs · buscador · ⌘K · avatar ─────────────────┐
│ Workspace▾ │                                                                                  │
│ ─────────  │                          ÁREA PRINCIPAL                          ┌ Panel ────┐  │
│ Dashboard  │                                                                  │ contextual│  │
│ Manual     │                                                                  │ (detalle, │  │
│ Moodboard  │                                                                  │ filtros,  │  │
│ Inspiración│                                                                  │ comments) │  │
│ Ideas      │                                                                  │           │  │
│ Contenido  │                                                                  └───────────┘  │
│ Calendario │                                                                                  │
│ Feed       │                                                                                  │
│ Campañas   │                                                                                  │
│ Recursos   │                                                                                  │
│ Copies     │                                                                                  │
│ Competencia│                                                                                  │
│ Stats      │                                                                                  │
│ ─────────  │                                                                                  │
│ Config     │                                                                                  │
└────────────┴──────────────────────────────────────────────────────────────────────────────────┘
```

**Gestor de Contenido — Galería (estilo Instagram)**
```
[Filtros: Formato ▾ Pilar ▾ Estado ▾ Fecha ▾]     [Vista: Galería|Calendario|Lista|Kanban|Timeline]

┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ img 1/n│ │  video │ │  img   │ │ img 1/n│    ← carrusel muestra solo la 1ª slide,
│ 🔲carru│ │ ▶ reel │ │ post   │ │ 🔲carru│      reel muestra portada + ▶
└────────┘ └────────┘ └────────┘ └────────┘
   click → modal fullscreen, swipe horizontal idéntico a Instagram (carrusel)
           o reproductor de video con copy/audio/duración a un costado (reel)
```

**Constructor de Feed**
```
┌───┬───┬───┐
│ 1 │ 2 │ 3 │   ← drag reordena, celda oculta se ve semitransparente con ícono "ojo tachado"
├───┼───┼───┤
│ 4 │ 5 │ 6 │
├───┼───┼───┤
│ 7 │ 8 │ 9 │
└───┴───┴───┘
```

**Manual Maestro (wiki)**
```
┌ Árbol de páginas ─┐ ┌ Editor TipTap ──────────────────────────────┐
│ ▸ Marca           │ │  H1 Historia                                 │
│   • Historia      │ │  párrafo editable, imágenes, tablas,         │
│   • Misión/Visión │ │  checklists, embeds — autosave "Guardado ✓"  │
│ ▸ Branding         │ │                                              │
│   • Colores        │ └──────────────────────────────────────────────┘
│   • Tipografías    │
│ ▸ Tono de voz       │
└────────────────────┘
```

---

## 6. Problemas detectados

**6.1 — Desalineación entre README y código real (bloqueante, necesito tu decisión).**
El README describe un proyecto en "Fase 4" con Supabase + 13 tablas con RLS ya configuradas, pero no hay `package.json`, `prisma/schema.prisma` ni ningún archivo de configuración en el repo — y las páginas existentes (`app/test/app/api/test/components/dashboard/Dashboard.tsx`) tienen rutas anidadas rotas, claramente producto de commits automatizados anteriores mal ejecutados (el path completo terminó como nombre de archivo). **No voy a tocar ni borrar nada de esto sin tu confirmación explícita** — ver pregunta al final.

**6.2 — Conflicto Prisma vs Row Level Security de Supabase.**
Si Supabase Auth/RLS protege las tablas a nivel de Postgres usando `auth.uid()` dentro de políticas, y Prisma se conecta con una connection string de servicio (bypassa RLS), entonces la autorización tiene que vivir en la capa de servicio (`/server/services` + `authz.ts`), no en RLS. Son dos modelos de seguridad distintos y hay que elegir uno como fuente de verdad para evitar agujeros. Mi recomendación es la opción A del §7.

**6.3 — Alcance del proyecto.**
Son 16 módulos, varios de complejidad "producto independiente" en sí mismos (Moodboard = mini-Miro, Feed Builder = simulador pixel-perfect de Instagram, Manual = mini-Notion). Construir todo de una sola vez generaría un PR gigante e imposible de revisar. Necesito que apruebes un orden de fases (propuesta en §8) antes de escribir código.

**6.4 — Moodboard: persistencia y performance.**
Guardar cada elemento como fila individual (mi propuesta en §3) da queries eficientes y updates granulares, pero con tableros de cientos de elementos hay que virtualizar el render (solo pintar lo visible en viewport) desde el día uno, no como optimización tardía — si no, la sensación "fluida como Miro" no se cumple.

**6.5 — Autosave + Undo/Redo transversal.**
Si cada módulo (TipTap, Moodboard, formularios) implementa su propio autosave/historial, se generan inconsistencias de UX (ej: Ctrl+Z funciona en un módulo y en otro no). Propongo un hook y un command-stack compartidos desde el inicio (ya reflejado en §1.4), no agregarlo después.

---

## 7. Mejoras propuestas (con justificación)

**7.1 — Storage: Supabase Storage en vez de UploadThing.**
El prompt permite "UploadThing o similar". Como ya se eligió Supabase para Auth, usar también su Storage evita un proveedor extra, comparte políticas de acceso con la misma sesión de usuario, y reduce superficie de configuración. UploadThing suma valor sobre todo si no hubiera ya un backend con storage — no es el caso acá.

**7.2 — @dnd-kit en vez de React DnD para drag & drop general.**
React DnD (basado en `react-dnd-html5-backend`) tiene peor soporte táctil/mobile y su mantenimiento es más lento. @dnd-kit (ya mencionado en el README original) es más liviano, tiene mejor accesibilidad (teclado) y es el estándar de facto en apps tipo Linear/Notion hoy. Reservo `react-grid-layout` solo para paneles reordenables tipo dashboard (si se necesita), no para Kanban/listas.

**7.3 — Feed Builder: @dnd-kit + CSS grid en vez de react-grid-layout.**
`react-grid-layout` está pensado para paneles redimensionables tipo dashboard, no para una grilla fija 3×N con aspect-ratio 1:1 tipo Instagram. Reordenar con @dnd-kit sortable sobre un CSS grid da control pixel-perfect del layout real de Instagram sin pelear contra las restricciones de tamaño de react-grid-layout.

**7.4 — Búsqueda global: Postgres full-text search para el MVP, no un motor externo.**
Typesense/Meilisearch mejoran relevancia pero suman infraestructura. Para el volumen esperado en fases tempranas, `tsvector`/`pg_trgm` en Postgres alcanza y se puede migrar después sin cambiar el modelo de datos.

**7.5 — Arquitectura "AI-ready" concreta.**
En vez de solo dejar botones deshabilitados, propongo definir ya la interfaz `AIAction` (`{ id, label, inputShape, run(input): Promise<AIJob> }`) y el modelo `AIJob` (§3), de forma que conectar un proveedor real más adelante sea enchufar una función, no rediseñar UI.

---

## 8. Roadmap propuesto (fases)

| Fase | Módulos | Por qué primero |
|---|---|---|
| **1 — Base** | Auth, Workspaces/Clientes, shell (sidebar/topbar/command palette), Manual Maestro, Banco de Ideas, Gestor de Contenido (vistas galería+lista+kanban), Calendario | Es el núcleo transaccional; todo lo demás depende de `Content`/`Idea`/`Workspace` |
| **2 — Visual** | Moodboard, Biblioteca de Inspiración, Constructor de Feed | Los módulos más ricos en interacción, se apoyan en `Content`/`Resource` ya existentes |
| **3 — Operación** | Campañas, Recursos, Banco de Copies, Competencia, Estadísticas, Timeline automático | Completan el ciclo operativo diario |
| **4 — Pulido + IA-ready** | Multi-cliente completo, permisos finos, atajos de teclado, empty states, skeletons, hooks de IA sin implementar | Barniz de producto comercial premium |

---

## Antes de avanzar necesito que decidas 4 cosas
