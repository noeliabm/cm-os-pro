import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "@/drizzle/schema";

/**
 * Patrón RLS-como-única-fuente-de-verdad (§1.5 de ARCHITECTURE.md).
 *
 * La conexión se abre con las credenciales del rol `authenticator` de
 * Supabase (el mismo rol que usa PostgREST) — un rol sin privilegios
 * directos sobre las tablas de la app, que solo puede `SET ROLE` hacia
 * `authenticated` o `service_role`. Así ninguna query corre "sin rol": o
 * pasa por `withRLS()` (evaluada contra las mismas políticas que vería
 * supabase-js) o por `withServiceRole()` (bypass explícito, ver más abajo),
 * nunca queda un tercer camino implícito.
 */
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

export type Db = typeof db;

export type JwtClaims = {
  sub: string; // user id (auth.uid())
  role?: string;
  [key: string]: unknown;
};

/**
 * Ejecuta `callback` en una transacción cuya sesión de Postgres queda
 * configurada igual que la vería PostgREST para ese usuario: rol
 * `authenticated` + `request.jwt.claims`. Las políticas RLS que llaman a
 * `auth.uid()` se evalúan idénticamente sin importar si la query llegó por
 * Drizzle o por el cliente supabase-js — es el mecanismo que permite tener
 * tipado fuerte de Drizzle sin duplicar autorización en TypeScript.
 */
export async function withRLS<T>(
  claims: JwtClaims,
  callback: (tx: typeof db) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`,
    );
    await tx.execute(sql`set local role authenticated`);
    return callback(tx as unknown as typeof db);
  });
}

/**
 * Bypassa RLS por completo (rol `service_role`, con BYPASSRLS en Postgres).
 *
 * USO EXCLUSIVO de /server/events/handlers — los consumidores del outbox
 * (`event_log`) corren en background sin un usuario autenticado en
 * contexto. Es la única puerta de bypass del sistema; no importar desde
 * código alcanzable por una request de usuario (Server Actions, route
 * handlers de páginas, etc.).
 */
export async function withServiceRole<T>(
  callback: (tx: typeof db) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`set local role service_role`);
    return callback(tx as unknown as typeof db);
  });
}

/**
 * Conexión sin rol ni RLS aplicados. Reservada a scripts de confianza que no
 * corren en respuesta a una request (drizzle-kit, drizzle/seed.ts, tareas de
 * CI) — nunca importar desde /app, /features, /server/services ni
 * /server/events/handlers.
 */
export const unsafeDb = db;
