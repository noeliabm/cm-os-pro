import { Megaphone } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function CampaignsPage() {
  return (
    <ComingSoon
      icon={Megaphone}
      title="Campañas"
      description="Agrupá contenido por campaña: lanzamientos, temporadas, promociones. Llega en Fase 3 — Creatividad."
    />
  );
}
