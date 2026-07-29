import { Trash2 } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function TrashPage() {
  return (
    <ComingSoon
      icon={Trash2}
      title="Papelera"
      description="Restauración con soft-delete transversal — falta la vista. Próximo en Fase 1."
    />
  );
}
