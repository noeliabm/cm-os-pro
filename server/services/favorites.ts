import { and, desc, eq } from "drizzle-orm";
import { favorites } from "@/drizzle/schema";
import { withRLS, type JwtClaims } from "@/lib/db";

export async function getFavorites(claims: JwtClaims, workspaceId: string) {
  return withRLS(claims, (tx) =>
    tx
      .select()
      .from(favorites)
      .where(and(eq(favorites.workspaceId, workspaceId), eq(favorites.userId, claims.sub)))
      .orderBy(desc(favorites.createdAt)),
  );
}
