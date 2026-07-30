import { sql } from "drizzle-orm";
import { withRLS, type JwtClaims } from "@/lib/db";
import type { PermissionKey } from "./matrix";

/**
 * Chequeo de permiso para decidir qué mostrar en la UI (ej. ocultar el
 * botón "Invitar miembro"). NUNCA es el mecanismo de autorización real —
 * eso es exclusivamente has_permission() evaluado dentro de las políticas
 * RLS de cada tabla (§1.8 de ARCHITECTURE.md). Si este chequeo dijera "sí"
 * por error, la mutación igual fallaría en la base de datos.
 */
export async function checkPermission(
  claims: JwtClaims,
  workspaceId: string,
  key: PermissionKey,
): Promise<boolean> {
  const [row] = await withRLS(claims, (tx) =>
    tx.execute(sql`select has_permission(${claims.sub}::uuid, ${workspaceId}::uuid, ${key}) as allowed`),
  );
  return Boolean((row as { allowed: boolean } | undefined)?.allowed);
}
