import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function StatsPage() {
  return (
    <ComingSoon
      icon={BarChart3}
      title="Estadísticas"
      description="Alcance, engagement y seguidores por publicación, con gráficos por período. Llega en Fase 4 — IA y optimización."
    />
  );
}
