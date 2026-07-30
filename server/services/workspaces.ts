import { cache } from "react";
import { eq } from "drizzle-orm";
import { workspaces, memberships } from "@/drizzle/schema";
import { withRLS, type JwtClaims } from "@/lib/db";

export const getWorkspacesForUser = cache(async (claims: JwtClaims) => {
  return withRLS(claims, (tx) =>
    tx
      .select({ id: workspaces.id, name: workspaces.name })
      .from(workspaces)
      .innerJoin(memberships, eq(memberships.workspaceId, workspaces.id))
      .orderBy(workspaces.createdAt),
  );
});

/**
 * Workspace "activo" del usuario. Simplificación deliberada de Fase 1: sin
 * selector persistido en cookie/URL todavía (§1.3 de ARCHITECTURE.md lo
 * marca como pendiente), así que todas las páginas usan el primer
 * workspace del usuario. Cambiar de workspace en el dropdown del sidebar
 * todavía no hace nada — falta wiring, no es un bug de esta función.
 */
export async function getPrimaryWorkspace(claims: JwtClaims) {
  const list = await getWorkspacesForUser(claims);
  return list[0] ?? null;
}
