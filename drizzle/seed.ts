import { unsafeDb as db } from "@/lib/db";
import { PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from "@/lib/permissions/matrix";
import {
  permissions,
  roleDefaultPermissions,
  platformFormats,
  type MembershipRole,
} from "./schema";

/**
 * Datos semilla globales (no dependen de ningún workspace): catálogo de
 * permisos + matriz de roles (fuente: lib/permissions/matrix.ts) y formatos
 * del plugin de Instagram (fuente: lib/plugins/instagram). Idempotente
 * (upsert) — se corre una vez por entorno con `pnpm db:seed`.
 */

async function seed() {
  await db.insert(permissions).values([...PERMISSIONS]).onConflictDoNothing();

  for (const [role, keys] of Object.entries(ROLE_DEFAULT_PERMISSIONS)) {
    await db
      .insert(roleDefaultPermissions)
      .values(keys.map((permissionKey) => ({ role: role as MembershipRole, permissionKey })))
      .onConflictDoNothing();
  }

  const { instagramPlugin } = await import("@/lib/plugins/instagram");
  await db
    .insert(platformFormats)
    .values(
      instagramPlugin.contentFormats.map((f) => ({
        platform: instagramPlugin.id,
        formatKey: f.key,
        label: f.label,
        rules: f.rules,
      })),
    )
    .onConflictDoNothing();

  console.log("Seed completo: permisos, matriz de roles y formatos de Instagram.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
