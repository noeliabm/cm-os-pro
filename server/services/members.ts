import { eq } from "drizzle-orm";
import { memberships, profiles } from "@/drizzle/schema";
import { withRLS, type JwtClaims } from "@/lib/db";

export async function getWorkspaceMembers(claims: JwtClaims, workspaceId: string) {
  return withRLS(claims, (tx) =>
    tx
      .select({
        membershipId: memberships.id,
        userId: memberships.userId,
        role: memberships.role,
        name: profiles.name,
        avatarUrl: profiles.avatarUrl,
        joinedAt: memberships.createdAt,
      })
      .from(memberships)
      .innerJoin(profiles, eq(profiles.id, memberships.userId))
      .where(eq(memberships.workspaceId, workspaceId))
      .orderBy(memberships.createdAt),
  );
}
