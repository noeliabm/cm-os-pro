import type { Db } from "@/lib/db";
import type { DomainEvent, DomainEventType } from "@/lib/events/types";
import { notifyOnMembershipCreated } from "./notifications";

export type EventHandler = (tx: Db, event: DomainEvent) => Promise<void>;

/**
 * Handlers registrados por tipo de evento. Cada uno corre bajo
 * `withServiceRole()` (ver server/events/drain.ts) — es la única puerta de
 * bypass de RLS del sistema (§1.5). Agregar un consumidor nuevo (ej. cuando
 * Activity Log necesite algo más que leer event_log directamente) es sumar
 * una entrada acá, sin tocar el módulo que emite el evento.
 */
export const eventHandlers: Partial<Record<DomainEventType, EventHandler[]>> = {
  "membership.created": [notifyOnMembershipCreated],
};
