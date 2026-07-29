import { GalleryHorizontal } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function ContentPage() {
  return (
    <ComingSoon
      icon={GalleryHorizontal}
      title="Gestor de contenido"
      description="El corazón del sistema: galería, calendario, lista, kanban y timeline de cada publicación. Llega en Fase 2 — Producción."
    />
  );
}
