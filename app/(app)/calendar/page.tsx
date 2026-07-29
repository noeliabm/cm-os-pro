import { CalendarDays } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function CalendarPage() {
  return (
    <ComingSoon
      icon={CalendarDays}
      title="Calendario editorial"
      description="Vista mensual y semanal con drag & drop para mover, duplicar y programar publicaciones. Llega en Fase 2 — Producción."
    />
  );
}
