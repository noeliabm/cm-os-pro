import { and, desc, eq, isNull } from "drizzle-orm";
import { notifications } from "@/drizzle/schema";
import { withRLS, type JwtClaims } from "@/lib/db";

export async function getRecentNotifications(claims: JwtClaims, workspaceId: string, limit = 20) {
  return withRLS(claims, (tx) =>
    tx
      .select()
      .from(notifications)
      .where(eq(notifications.workspaceId, workspaceId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit),
  );
}

export async function getUnreadCount(claims: JwtClaims, workspaceId: string) {
  const rows = await withRLS(claims, (tx) =>
    tx
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.workspaceId, workspaceId), isNull(notifications.readAt))),
  );
  return rows.length;
}
