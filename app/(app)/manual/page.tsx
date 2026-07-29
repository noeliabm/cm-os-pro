import { BookOpen } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function ManualPage() {
  return (
    <ComingSoon
      icon={BookOpen}
      title="Manual maestro"
      description="La wiki de marca: historia, tono de voz, branding y guías editables con TipTap. Llega en Fase 3 — Creatividad."
    />
  );
}
