import { eq } from "drizzle-orm";
import { workspaces, memberships } from "@/drizzle/schema";
import { withRLS, type JwtClaims } from "@/lib/db";

export async function getWorkspacesForUser(claims: JwtClaims) {
  return withRLS(claims, (tx) =>
    tx
      .select({ id: workspaces.id, name: workspaces.name })
      .from(workspaces)
      .innerJoin(memberships, eq(memberships.workspaceId, workspaces.id))
      .orderBy(workspaces.createdAt),
  );
}
