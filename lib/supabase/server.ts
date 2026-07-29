import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para Server Components/Actions/Route Handlers.
 * Solo se usa para leer la sesión (auth) — las queries a datos pasan por
 * Drizzle + withRLS()/withServiceRole() (lib/db), no por este cliente.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Se llama desde un Server Component sin permiso de escritura;
            // el middleware (middleware.ts) ya se encarga de refrescar la
            // sesión en ese caso.
          }
        },
      },
    },
  );
}
