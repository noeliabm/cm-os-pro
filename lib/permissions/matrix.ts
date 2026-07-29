import type { MembershipRole } from "@/drizzle/schema";

/**
 * Única fuente de verdad en TypeScript para el catálogo de permisos y la
 * matriz de defaults por rol — drizzle/seed.ts la usa para poblar
 * `permissions`/`role_default_permissions`. La autorización real sigue
 * viviendo en Postgres (`has_permission()`, ver la migración 0000); esto
 * es lo que se siembra ahí y lo que la UI consulta para decidir qué
 * mostrar (§1.8 de ARCHITECTURE.md — nunca como mecanismo de seguridad).
 */
export const PERMISSIONS = [
  { key: "content:create", label: "Crear contenido", category: "content" },
  { key: "content:edit", label: "Editar contenido", category: "content" },
  { key: "content:delete", label: "Eliminar contenido", category: "content" },
  { key: "content:publish", label: "Marcar como publicado", category: "content" },
  { key: "brief:create", label: "Crear brief", category: "brief" },
  { key: "brief:approve", label: "Aprobar brief", category: "brief" },
  { key: "moodboard:edit", label: "Editar moodboard", category: "moodboard" },
  { key: "stats:view", label: "Ver estadísticas", category: "stats" },
  { key: "settings:manage", label: "Administrar workspace", category: "settings" },
  { key: "members:invite", label: "Invitar/gestionar miembros", category: "settings" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const ROLE_DEFAULT_PERMISSIONS: Record<MembershipRole, PermissionKey[]> = {
  OWNER: PERMISSIONS.map((p) => p.key),
  ADMIN: PERMISSIONS.map((p) => p.key),
  EDITOR: ["content:create", "content:edit", "brief:create", "moodboard:edit", "stats:view"],
  VIEWER: ["stats:view"],
};
