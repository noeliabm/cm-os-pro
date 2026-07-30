import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con la service role key — puede crear/listar usuarios de Auth
 * (`auth.admin.*`). Server-only, nunca importar desde un Client Component.
 * Se usa exclusivamente para invitar miembros nuevos por email
 * (lib/auth/members-actions.ts); todo lo demás sigue pasando por Drizzle +
 * withRLS/withServiceRole (lib/db), este cliente no toca esas tablas.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
