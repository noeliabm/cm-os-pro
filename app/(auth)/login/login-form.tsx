"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type AuthFormState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state.error && (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="mt-1">
        {isPending ? "Entrando…" : "Entrar"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        ¿No tenés cuenta todavía?{" "}
        <Link href="/signup" className="text-foreground underline underline-offset-4">
          Creá una
        </Link>
      </p>
    </form>
  );
}
