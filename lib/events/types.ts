import type { MembershipRole } from "@/drizzle/schema";

interface BaseEvent {
  workspaceId: string;
  actorId: string;
  entityType?: string;
  entityId?: string;
}

/**
 * Catálogo tipado de eventos de dominio (§1.6 de ARCHITECTURE.md). Cada
 * módulo declara acá qué eventos emite; es la única forma de acoplamiento
 * permitida entre módulos — nada se importa directamente entre features
 * para producir un efecto secundario en otro módulo.
 *
 * Fase 1 solo incluye los eventos de infraestructura (workspaces/miembros).
 * content.*, idea.*, brief.* etc. se suman en Fase 2 cuando esos módulos
 * existan.
 */
export type DomainEvent =
  | (BaseEvent & {
      type: "workspace.created";
      payload: { name: string };
    })
  | (BaseEvent & {
      type: "membership.created";
      // email va en el payload (no solo userId) para que describeEvent()
      // pueda nombrar a quién se agregó sin tener que resolver el join en
      // cada lugar que renderiza el evento — actorId ya identifica a quién
      // hizo la invitación, no confundir los dos roles acá.
      payload: { membershipId: string; userId: string; email: string; role: MembershipRole };
    })
  | (BaseEvent & {
      type: "membership.role_changed";
      payload: {
        membershipId: string;
        userId: string;
        from: MembershipRole;
        to: MembershipRole;
      };
    })
  | (BaseEvent & {
      type: "item.trashed";
      entityType: string;
      entityId: string;
      payload: Record<string, never>;
    })
  | (BaseEvent & {
      type: "item.restored";
      entityType: string;
      entityId: string;
      payload: Record<string, never>;
    });

export type DomainEventType = DomainEvent["type"];
