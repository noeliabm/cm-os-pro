import type { DomainEvent, DomainEventType } from "./types";

type EventOfType<T extends DomainEventType> = Extract<DomainEvent, { type: T }>;
type Listener<T extends DomainEventType> = (event: EventOfType<T>) => void;

/**
 * Bus síncrono en memoria (§1.6, mecanismo 1 de 2): efectos que deben
 * ocurrir dentro del mismo request, sin necesidad de durabilidad ni
 * reintentos (ej. invalidar una cache local). No reemplaza al outbox
 * (`event_log`) — ver dispatch.ts — que es lo que alimenta Notifications,
 * Activity Log, etc. de forma confiable entre procesos.
 */
class EventBus {
  private listeners = new Map<DomainEventType, Set<Listener<DomainEventType>>>();

  on<T extends DomainEventType>(type: T, listener: Listener<T>): () => void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener as unknown as Listener<DomainEventType>);
    this.listeners.set(type, set);
    return () => set.delete(listener as unknown as Listener<DomainEventType>);
  }

  emit(event: DomainEvent): void {
    const set = this.listeners.get(event.type);
    if (!set) return;
    for (const listener of set) listener(event);
  }
}

export const eventBus = new EventBus();
