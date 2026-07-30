import { notifications, workspaces } from "@/drizzle/schema";
import type { Db } from "@/lib/db";
import type { DomainEvent } from "@/lib/events/types";
import { eq } from "drizzle-orm";

/**
 * Primer consumidor real del outbox: cuando se crea una membresía, notifica
 * al usuario agregado. Sirve como caso de referencia para el resto de los
 * handlers que se vayan sumando en Fase 2 (content.status_changed,
 * comment.created, brief.approved...).
 */
export async function notifyOnMembershipCreated(tx: Db, event: DomainEvent) {
  if (event.type !== "membership.created") return;

  const [workspace] = await tx
    .select({ name: workspaces.name })
    .from(workspaces)
    .where(eq(workspaces.id, event.workspaceId))
    .limit(1);

  await tx.insert(notifications).values({
    userId: event.payload.userId,
    workspaceId: event.workspaceId,
    type: "membership.created",
    payload: {
      workspaceName: workspace?.name ?? "un workspace",
      role: event.payload.role,
      email: event.payload.email,
    },
    entityType: "membership",
    entityId: event.payload.membershipId,
  });
}
