import { redirect } from "next/navigation";
import { History } from "lucide-react";
import { getAuthContext } from "@/lib/auth/context";
import { getPrimaryWorkspace } from "@/server/services/workspaces";
import { getActivityLog } from "@/server/services/activity";
import { describeEvent } from "@/lib/events/describe";
import { ComingSoon } from "@/components/shared/coming-soon";

function dayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  if (sameDay(date, today)) return "Hoy";
  if (sameDay(date, yesterday)) return "Ayer";
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "long" });
}

export default async function ActivityPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const workspace = await getPrimaryWorkspace(auth.claims);
  if (!workspace) redirect("/dashboard");

  const events = await getActivityLog(auth.claims, workspace.id);

  if (events.length === 0) {
    return (
      <ComingSoon
        icon={History}
        title="Sin actividad todavía"
        description="Cada cambio relevante en el workspace va a quedar registrado acá automáticamente."
      />
    );
  }

  const groups = new Map<string, typeof events>();
  for (const event of events) {
    const label = dayLabel(event.createdAt);
    groups.set(label, [...(groups.get(label) ?? []), event]);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 py-4">
      <h1 className="font-serif text-2xl italic">Actividad</h1>
      {[...groups.entries()].map(([label, items]) => (
        <div key={label} className="flex flex-col gap-3">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          <div className="flex flex-col gap-2.5">
            {items.map((event) => (
              <div key={event.id} className="flex items-baseline gap-3 text-sm">
                <span className="text-muted-foreground w-12 shrink-0 tabular-nums">
                  {event.createdAt.toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>
                  <span className="font-medium">{event.actorName ?? "Alguien"}</span>{" "}
                  {describeEvent(event.type, event.payload)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
