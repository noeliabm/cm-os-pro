import { and, desc, eq } from "drizzle-orm";
import { recentlyViewed } from "@/drizzle/schema";
import { withRLS, type JwtClaims } from "@/lib/db";

export async function getRecentlyViewed(claims: JwtClaims, workspaceId: string, limit = 20) {
  return withRLS(claims, (tx) =>
    tx
      .select()
      .from(recentlyViewed)
      .where(and(eq(recentlyViewed.workspaceId, workspaceId), eq(recentlyViewed.userId, claims.sub)))
      .orderBy(desc(recentlyViewed.viewedAt))
      .limit(limit),
  );
}
