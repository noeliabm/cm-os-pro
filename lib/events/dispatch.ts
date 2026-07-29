import { eventLog } from "@/drizzle/schema";
import type { Db } from "@/lib/db";
import { eventBus } from "./bus";
import type { DomainEvent } from "./types";

/**
 * Escribe el evento en el outbox (`event_log`) DENTRO de la misma
 * transacción que la mutación que lo origina — si la mutación falla, el
 * evento nunca se escribe, no hay eventos huérfanos (§1.6). También lo
 * emite en el bus en memoria para los efectos síncronos del mismo request.
 *
 * `tx` debe ser la transacción abierta por `withRLS()` de la Server Action
 * que llama a esto — nunca una conexión nueva.
 */
export async function dispatchEvent(tx: Db, event: DomainEvent): Promise<void> {
  await tx.insert(eventLog).values({
    workspaceId: event.workspaceId,
    type: event.type,
    payload: event.payload,
    actorId: event.actorId,
    entityType: event.entityType ?? null,
    entityId: event.entityId ?? null,
  });

  eventBus.emit(event);
}
