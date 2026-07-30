import { sql } from "drizzle-orm";
import {
  pgTable,
  pgPolicy,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { authUsers, authenticatedRole, authUid } from "drizzle-orm/supabase";

/**
 * Fase 1 — Infraestructura.
 *
 * Todas las tablas se crean con RLS habilitado (`.enableRLS()`) y las
 * políticas quedan declaradas junto al schema (§1.5 de ARCHITECTURE.md):
 * Postgres/RLS es la única fuente de verdad de autorización, no hay
 * chequeos de rol/permiso replicados en TypeScript.
 *
 * `has_permission(uid, workspace_id, key)` (usada en varias políticas de
 * abajo) es una función SQL que no se puede expresar con el DSL de Drizzle
 * — se agrega a mano dentro de la migración generada (justo antes de las
 * políticas que la usan, después de todos los CREATE TABLE: Postgres valida
 * al crear una función LANGUAGE sql que las tablas referenciadas ya
 * existan). Si se regenera la migración con `drizzle-kit generate` hay que
 * volver a pegarla en el archivo nuevo — drizzle-kit no sabe de su
 * existencia porque no tiene DSL para funciones.
 */

// ---------------------------------------------------------------------------
// Organizations / Workspaces / Profiles / Memberships
// ---------------------------------------------------------------------------

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    plan: text("plan").notNull().default("free"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    pgPolicy("organizations_select_member", {
      for: "select",
      to: authenticatedRole,
      // Nota: se referencian "workspaces"/"memberships" por nombre literal
      // (no como objetos de tabla de Drizzle) porque ambas se declaran más
      // abajo en este archivo — evita un ciclo de inferencia de tipos entre
      // consts (organizations → workspaces → organizations.id).
      using: sql`exists (
        select 1 from workspaces
        join memberships on memberships.workspace_id = workspaces.id
        where workspaces.organization_id = ${table.id}
        and memberships.user_id = ${authUid}
      )`,
    }),
  ],
).enableRLS();

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logoUrl: text("logo_url"),
    brandColor: text("brand_color"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("workspaces_slug_idx").on(table.slug),
    pgPolicy("workspaces_select_member", {
      for: "select",
      to: authenticatedRole,
      // "memberships" por nombre literal: se declara más abajo (ver nota en
      // organizations_select_member).
      using: sql`exists (
        select 1 from memberships
        where memberships.workspace_id = ${table.id}
        and memberships.user_id = ${authUid}
      )`,
    }),
    pgPolicy("workspaces_update_admin", {
      for: "update",
      to: authenticatedRole,
      using: sql`has_permission(${authUid}, ${table.id}, 'settings:manage')`,
    }),
  ],
).enableRLS();

/** Espejo de auth.users con datos de perfil propios de la app. */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    pgPolicy("profiles_select_workspace_peers", {
      for: "select",
      to: authenticatedRole,
      // Un usuario ve su propio perfil y el de cualquier miembro con quien
      // comparta al menos un workspace (para listas de asignación, @menciones...).
      // "memberships" por nombre literal: se declara más abajo.
      using: sql`${table.id} = ${authUid} or exists (
        select 1 from memberships m1
        join memberships m2 on m1.workspace_id = m2.workspace_id
        where m1.user_id = ${authUid} and m2.user_id = ${table.id}
      )`,
    }),
    pgPolicy("profiles_update_self", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.id} = ${authUid}`,
    }),
  ],
).enableRLS();

export const roleEnum = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;
export type MembershipRole = (typeof roleEnum)[number];

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    role: text("role", { enum: roleEnum }).notNull().default("VIEWER"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("memberships_user_workspace_idx").on(
      table.userId,
      table.workspaceId,
    ),
    pgPolicy("memberships_select_workspace_peers", {
      for: "select",
      to: authenticatedRole,
      // is_workspace_member() (SECURITY DEFINER, ver la migración) en vez
      // de un self-join sobre "memberships": una política de esta tabla
      // que consulta esta misma tabla dispara de nuevo su propia RLS,
      // entrando en recursión infinita (confirmado corriendo la migración
      // contra Postgres real, no es solo una preocupación teórica).
      using: sql`is_workspace_member(${authUid}, ${table.workspaceId})`,
    }),
    pgPolicy("memberships_manage_admin", {
      for: "all",
      to: authenticatedRole,
      using: sql`has_permission(${authUid}, ${table.workspaceId}, 'members:invite')`,
    }),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// Permisos granulares (§1.8)
// ---------------------------------------------------------------------------

export const permissions = pgTable(
  "permissions",
  {
    key: text("key").primaryKey(), // ej. 'content:publish'
    label: text("label").notNull(),
    category: text("category").notNull(),
  },
  () => [
    // Catálogo global de solo lectura. Originalmente se dejó esta tabla sin
    // RLS asumiendo que "nadie tiene motivo para escribirla" alcanzaba como
    // protección — el editor SQL de Supabase marcó el error real: sin RLS,
    // los GRANT por default de Supabase sobre el schema public dejan a
    // `authenticated` con permiso de escritura, no solo lectura. Con RLS
    // habilitado y una única política de SELECT, un usuario autenticado
    // podría alterar la matriz de permisos de la que depende has_permission().
    pgPolicy("permissions_select_authenticated", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
).enableRLS();

export const roleDefaultPermissions = pgTable(
  "role_default_permissions",
  {
    role: text("role", { enum: roleEnum }).notNull(),
    permissionKey: text("permission_key")
      .notNull()
      .references(() => permissions.key, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.role, table.permissionKey] }),
    // Mismo motivo que permissions: solo lectura para authenticated, sin
    // política de escritura — es la matriz que has_permission() consulta
    // para resolver defaults de rol.
    pgPolicy("role_default_permissions_select_authenticated", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
).enableRLS();

export const membershipPermissionOverrides = pgTable(
  "membership_permission_overrides",
  {
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    permissionKey: text("permission_key")
      .notNull()
      .references(() => permissions.key, { onDelete: "cascade" }),
    granted: boolean("granted").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.membershipId, table.permissionKey] }),
    pgPolicy("permission_overrides_manage_admin", {
      for: "all",
      to: authenticatedRole,
      // Simplificación deliberada: gestionar overrides requiere ser
      // OWNER/ADMIN del workspace de esa membresía, en vez de pasar por
      // has_permission() — evita una dependencia circular (la tabla que
      // define permisos no puede depender de sí misma para autorizarse).
      using: sql`exists (
        select 1 from ${memberships} m
        join ${memberships} target on target.id = ${table.membershipId}
        where m.workspace_id = target.workspace_id
        and m.user_id = ${authUid}
        and m.role in ('OWNER', 'ADMIN')
      )`,
    }),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// Event Bus / outbox durable (§1.6)
// ---------------------------------------------------------------------------

export const eventLog = pgTable(
  "event_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // catálogo tipado en lib/events/types.ts
    payload: jsonb("payload").notNull(),
    actorId: uuid("actor_id").references(() => authUsers.id),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    index("event_log_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
    index("event_log_unprocessed_idx")
      .on(table.processedAt)
      .where(sql`${table.processedAt} is null`),
    // processedAt es un marcador de conveniencia ("ya lo vieron todos los
    // handlers registrados"); la fuente de verdad por handler individual
    // vive en event_handler_log (permite que un handler roto/lento no
    // bloquee a los demás — ver §6.6 de ARCHITECTURE.md).
    pgPolicy("event_log_select_workspace_member", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists (
        select 1 from ${memberships}
        where ${memberships.workspaceId} = ${table.workspaceId}
        and ${memberships.userId} = ${authUid}
      )`,
    }),
    pgPolicy("event_log_insert_workspace_member", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists (
        select 1 from ${memberships}
        where ${memberships.workspaceId} = ${table.workspaceId}
        and ${memberships.userId} = ${authUid}
      )`,
    }),
    // Sin política de UPDATE para 'authenticated': solo el dispatcher en
    // background (service role, que bypassa RLS) marca processedAt.
  ],
).enableRLS();

/** Estado de procesamiento por (evento, handler) — ver comentario en event_log. */
export const eventHandlerLog = pgTable(
  "event_handler_log",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => eventLog.id, { onDelete: "cascade" }),
    handlerName: text("handler_name").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    error: text("error"),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.handlerName] })],
).enableRLS();
// RLS habilitado SIN ninguna política: bloquea el acceso a `authenticated`
// y `anon` por completo. Solo `service_role` (bypassa RLS) — el dispatcher
// en background — puede leer o escribir acá. Nadie más tiene motivo.

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
    pgPolicy("notifications_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("notifications_mark_read_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    // Sin política de INSERT para 'authenticated': las crean los handlers
    // de eventos (service role) en /server/events/handlers, nunca el cliente.
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// Favorites / Recently Viewed
// ---------------------------------------------------------------------------

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("favorites_user_entity_idx").on(
      table.userId,
      table.entityType,
      table.entityId,
    ),
    pgPolicy("favorites_manage_own", {
      for: "all",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS();

export const recentlyViewed = pgTable(
  "recently_viewed",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    viewedAt: timestamp("viewed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("recently_viewed_user_entity_idx").on(
      table.userId,
      table.entityType,
      table.entityId,
    ),
    pgPolicy("recently_viewed_manage_own", {
      for: "all",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// Plugins multi-plataforma (§1.7) — catálogo mínimo de Fase 1
// ---------------------------------------------------------------------------

export const platformFormats = pgTable(
  "platform_formats",
  {
    platform: text("platform").notNull(), // 'instagram'
    formatKey: text("format_key").notNull(), // 'post' | 'reel' | 'carrusel' | 'historia'
    label: text("label").notNull(),
    rules: jsonb("rules").notNull().default({}),
  },
  (table) => [
    primaryKey({ columns: [table.platform, table.formatKey] }),
    pgPolicy("platform_formats_select_authenticated", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
).enableRLS();
// Catálogo global de solo lectura, poblado por cada plugin en su seed.
