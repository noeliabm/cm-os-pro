# CM OS Pro — Content Operating System

Sistema operativo de contenido para Instagram: branding, planificación, inspiración, producción y organización de contenido en un solo lugar.

Ver [`ARCHITECTURE.md`](./ARCHITECTURE.md) para la arquitectura completa, el modelo de datos y el roadmap por fases. Este proyecto se desarrolla fase por fase con aprobación explícita en cada etapa — el roadmap actual es **Infraestructura → Producción → Creatividad → IA y optimización**.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (componentes propios, ver nota abajo) · Zustand · TanStack Query · Drizzle ORM + drizzle-kit · Supabase (Auth, Postgres, Storage) · TipTap · React Flow · @dnd-kit · React Big Calendar

## Setup

```bash
pnpm install
cp .env.example .env.local   # completar con las credenciales del proyecto de Supabase
pnpm db:generate              # regenerar migraciones tras cambiar drizzle/schema.ts
pnpm db:push                  # aplicar el schema a la base (desarrollo)
pnpm db:seed                  # poblar catálogo de permisos, matriz de roles y formatos de Instagram
pnpm dev
```

## Seguridad

Row Level Security de Postgres (vía Supabase) es la única fuente de verdad de autorización — no hay chequeos de rol/permiso duplicados en TypeScript. Ver `lib/db/index.ts` (`withRLS` / `withServiceRole`) y §1.5 de `ARCHITECTURE.md`.

## Nota sobre shadcn/ui

`ui.shadcn.com` está bloqueado por la política de red de este entorno de desarrollo, así que los componentes en `components/ui/` están escritos a mano siguiendo exactamente las mismas convenciones (Radix + `class-variance-authority` + `cn()`) en vez de generarse con el CLI. `components.json` queda igual configurado por si en otro entorno sí se puede correr `npx shadcn add <componente>`.

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest |
| `pnpm db:generate` | Genera migraciones SQL a partir de `drizzle/schema.ts` |
| `pnpm db:push` | Aplica el schema directo a la base (desarrollo) |
| `pnpm db:seed` | Corre `drizzle/seed.ts` |
