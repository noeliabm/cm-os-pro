import { desc, eq } from "drizzle-orm";
import { eventLog, profiles } from "@/drizzle/schema";
import { withRLS, type JwtClaims } from "@/lib/db";

export async function getActivityLog(claims: JwtClaims, workspaceId: string, limit = 50) {
  return withRLS(claims, (tx) =>
    tx
      .select({
        id: eventLog.id,
        type: eventLog.type,
        payload: eventLog.payload,
        createdAt: eventLog.createdAt,
        actorName: profiles.name,
      })
      .from(eventLog)
      .leftJoin(profiles, eq(profiles.id, eventLog.actorId))
      .where(eq(eventLog.workspaceId, workspaceId))
      .orderBy(desc(eventLog.createdAt))
      .limit(limit),
  );
}
