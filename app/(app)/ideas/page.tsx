import { Lightbulb } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function IdeasPage() {
  return (
    <ComingSoon
      icon={Lightbulb}
      title="Banco de ideas"
      description="Vista tipo Notion para capturar y priorizar ideas antes de convertirlas en contenido. Llega en Fase 2 — Producción."
    />
  );
}
