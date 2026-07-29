import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar — CM OS Pro" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl tracking-tight italic">
          Bienvenida de nuevo
        </h1>
        <p className="text-muted-foreground text-sm">
          Entrá para seguir con la estrategia de contenido.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
