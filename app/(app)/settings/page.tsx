import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function SettingsPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Configuración"
      description="Miembros, roles, permisos granulares y datos del workspace. Próximo en Fase 1."
    />
  );
}
