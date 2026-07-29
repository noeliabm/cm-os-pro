import { and, asc, eq, isNull } from "drizzle-orm";
import { eventLog, eventHandlerLog } from "@/drizzle/schema";
import { withServiceRole, type Db } from "@/lib/db";
import type { DomainEvent } from "@/lib/events/types";
import { eventHandlers } from "./handlers/registry";

const BATCH_SIZE = 50;

/**
 * Drena el outbox: para cada evento no marcado `processedAt`, corre los
 * handlers registrados para su tipo que todavía no tengan una fila exitosa
 * en `event_handler_log`. Un handler que falla queda registrado con su
 * error y se reintenta en la próxima corrida — no bloquea a los demás
 * handlers del mismo evento (§6.6 de ARCHITECTURE.md).
 *
 * Pensado para ser invocado por un cron externo (Supabase Edge Function
 * programada, o equivalente) vía app/api/internal/events/drain/route.ts —
 * no hay infraestructura de cron real conectada todavía en este entorno.
 */
export async function drainEvents(): Promise<{ processed: number; failed: number }> {
  return withServiceRole(async (tx) => {
    const pending = await tx
      .select()
      .from(eventLog)
      .where(isNull(eventLog.processedAt))
      .orderBy(asc(eventLog.createdAt))
      .limit(BATCH_SIZE);

    let processed = 0;
    let failed = 0;

    for (const row of pending) {
      const handlers = eventHandlers[row.type as DomainEvent["type"]] ?? [];
      const event = {
        type: row.type,
        workspaceId: row.workspaceId,
        actorId: row.actorId,
        entityType: row.entityType ?? undefined,
        entityId: row.entityId ?? undefined,
        payload: row.payload,
      } as DomainEvent;

      let allSucceeded = true;

      for (const handler of handlers) {
        const alreadyDone = await tx
          .select({ eventId: eventHandlerLog.eventId })
          .from(eventHandlerLog)
          .where(
            and(
              eq(eventHandlerLog.eventId, row.id),
              eq(eventHandlerLog.handlerName, handler.name),
            ),
          )
          .limit(1);

        if (alreadyDone.length > 0) continue;

        try {
          await runHandler(tx, handler, event);
          await tx
            .insert(eventHandlerLog)
            .values({ eventId: row.id, handlerName: handler.name, processedAt: new Date() })
            .onConflictDoUpdate({
              target: [eventHandlerLog.eventId, eventHandlerLog.handlerName],
              set: { processedAt: new Date(), error: null },
            });
        } catch (err) {
          allSucceeded = false;
          failed += 1;
          await tx
            .insert(eventHandlerLog)
            .values({
              eventId: row.id,
              handlerName: handler.name,
              error: err instanceof Error ? err.message : String(err),
            })
            .onConflictDoUpdate({
              target: [eventHandlerLog.eventId, eventHandlerLog.handlerName],
              set: { error: err instanceof Error ? err.message : String(err) },
            });
        }
      }

      if (allSucceeded) {
        await tx.update(eventLog).set({ processedAt: new Date() }).where(eq(eventLog.id, row.id));
        processed += 1;
      }
    }

    return { processed, failed };
  });
}

function runHandler(
  tx: Db,
  handler: (tx: Db, event: DomainEvent) => Promise<void>,
  event: DomainEvent,
) {
  return handler(tx, event);
}
