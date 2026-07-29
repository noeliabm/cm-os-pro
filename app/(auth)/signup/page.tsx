import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Crear cuenta — CM OS Pro" };

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl tracking-tight italic">
          Creá tu espacio
        </h1>
        <p className="text-muted-foreground text-sm">
          Centralizá el branding, la planificación y la producción de contenido.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
