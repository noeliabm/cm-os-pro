import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function BriefPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Brief de contenido"
      description="El punto de partida del flujo creativo: objetivo, audiencia, mensaje clave y entregables. Llega en Fase 2 — Producción."
    />
  );
}
