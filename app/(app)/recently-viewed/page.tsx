import { Clock } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function RecentlyViewedPage() {
  return (
    <ComingSoon
      icon={Clock}
      title="Vistos recientemente"
      description="El modelo de datos ya existe (recently_viewed) — falta la vista. Próximo en Fase 1."
    />
  );
}
