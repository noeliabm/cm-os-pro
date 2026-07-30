import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JwtClaims } from "@/lib/db";

export interface AuthContext {
  userId: string;
  email: string | undefined;
  claims: JwtClaims;
}

/**
 * null si no hay sesión — para páginas/Server Actions que manejan ambos
 * casos. Envuelta en `cache()` de React: layout.tsx y cada página bajo
 * (app) la llaman por separado (RSC no comparte estado entre server
 * components), así se deduplica a una sola consulta por request.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    userId: user.id,
    email: user.email,
    claims: { sub: user.id, role: "authenticated" },
  };
});

/** Lanza si no hay sesión — para Server Actions que solo tienen sentido autenticadas. */
export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("No autenticado");
  return ctx;
}
