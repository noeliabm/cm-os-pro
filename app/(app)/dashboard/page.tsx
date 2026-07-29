import { Lightbulb, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * El Dashboard completo (§1 del spec: próximas publicaciones, ideas
 * pendientes, calendario resumido, actividad reciente...) se arma con datos
 * reales a medida que existan Ideas/Content/Calendario (Fase 2) — llenar
 * esta pantalla hoy con seis tarjetas vacías simulando widgets habría sido
 * exactamente el "dashboard corporativo genérico" que se pidió evitar.
 * Mientras tanto, un único estado vacío con las acciones que sí existen.
 */
export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-10 py-20 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl tracking-tight italic">
          Buenas
        </h1>
        <p className="text-muted-foreground text-balance">
          Todavía no hay contenido en este workspace. Empezá por un brief o
          una idea y este panel se va a ir llenando solo.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <a href="/brief">
            <FileText />
            Crear un brief
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/ideas">
            <Lightbulb />
            Nueva idea
          </a>
        </Button>
        <Button variant="ghost" asChild>
          <a href="/settings">
            <Users />
            Invitar al equipo
          </a>
        </Button>
      </div>
    </div>
  );
}
