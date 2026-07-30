import type { DomainEventType } from "./types";

/**
 * Traduce un evento de dominio a una línea legible — usado tanto por el
 * Activity Log (todos los eventos de un workspace) como por la campanita de
 * Notifications (los que le tocan a un usuario puntual), para no mantener
 * dos switch/case iguales. Cada evento nuevo que sume Fase 2+ agrega un
 * caso acá, no en cada lugar que lo muestra.
 *
 * Se describe en 3ª persona neutra ("agregó a...", no "te agregaron a...")
 * porque el mismo texto se usa tanto en Activity Log (un observador lee
 * sobre otra persona) como en Notifications (el propio afectado lee sobre
 * sí mismo) — no diferencia el punto de vista todavía, queda como
 * simplificación de v1.
 */
export function describeEvent(type: string, payload: unknown): string {
  switch (type as DomainEventType) {
    case "membership.created": {
      // El sujeto de la oración es a quién se agregó (payload.email), NO
      // quién hizo la acción — eso ya es actorId/actorName en quien llama a
      // describeEvent. Mezclar los dos leía como "Noelia se sumó..." cuando
      // en realidad Noelia invitó a otra persona.
      const p = payload as { email?: string; role?: string; workspaceName?: string };
      const who = p.email ?? "un nuevo miembro";
      return p.workspaceName
        ? `agregó a ${who} como ${p.role ?? "miembro"} en ${p.workspaceName}`
        : `agregó a ${who} como ${p.role ?? "miembro"}`;
    }
    case "membership.role_changed": {
      const p = payload as { from?: string; to?: string };
      return `cambió de rol: ${p.from ?? "?"} → ${p.to ?? "?"}`;
    }
    case "workspace.created":
      return "creó el workspace";
    case "item.trashed":
      return "movió un elemento a la papelera";
    case "item.restored":
      return "restauró un elemento de la papelera";
    default:
      return type;
  }
}
