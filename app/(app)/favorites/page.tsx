import { Star } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function FavoritesPage() {
  return (
    <ComingSoon
      icon={Star}
      title="Favoritos"
      description="El modelo de datos ya existe (favorites) — falta la vista. Próximo en Fase 1."
    />
  );
}
