CREATE TABLE "event_handler_log" (
	"event_id" uuid NOT NULL,
	"handler_name" text NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text,
	CONSTRAINT "event_handler_log_event_id_handler_name_pk" PRIMARY KEY("event_id","handler_name")
);
--> statement-breakpoint
ALTER TABLE "event_handler_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "event_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"actor_id" uuid,
	"entity_type" text,
	"entity_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "event_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "favorites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "membership_permission_overrides" (
	"membership_id" uuid NOT NULL,
	"permission_key" text NOT NULL,
	"granted" boolean NOT NULL,
	CONSTRAINT "membership_permission_overrides_membership_id_permission_key_pk" PRIMARY KEY("membership_id","permission_key")
);
--> statement-breakpoint
ALTER TABLE "membership_permission_overrides" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"role" text DEFAULT 'VIEWER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "permissions" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"category" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "platform_formats" (
	"platform" text NOT NULL,
	"format_key" text NOT NULL,
	"label" text NOT NULL,
	"rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "platform_formats_platform_format_key_pk" PRIMARY KEY("platform","format_key")
);
--> statement-breakpoint
ALTER TABLE "platform_formats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "recently_viewed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recently_viewed" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "role_default_permissions" (
	"role" text NOT NULL,
	"permission_key" text NOT NULL,
	CONSTRAINT "role_default_permissions_role_permission_key_pk" PRIMARY KEY("role","permission_key")
);
--> statement-breakpoint
ALTER TABLE "role_default_permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"brand_color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "event_handler_log" ADD CONSTRAINT "event_handler_log_event_id_event_log_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event_log"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_log" ADD CONSTRAINT "event_log_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_log" ADD CONSTRAINT "event_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_permission_overrides" ADD CONSTRAINT "membership_permission_overrides_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_permission_overrides" ADD CONSTRAINT "membership_permission_overrides_permission_key_permissions_key_fk" FOREIGN KEY ("permission_key") REFERENCES "public"."permissions"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_default_permissions" ADD CONSTRAINT "role_default_permissions_permission_key_permissions_key_fk" FOREIGN KEY ("permission_key") REFERENCES "public"."permissions"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_log_workspace_created_idx" ON "event_log" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "event_log_unprocessed_idx" ON "event_log" USING btree ("processed_at") WHERE "event_log"."processed_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_entity_idx" ON "favorites" USING btree ("user_id","entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_user_workspace_idx" ON "memberships" USING btree ("user_id","workspace_id");--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "recently_viewed_user_entity_idx" ON "recently_viewed" USING btree ("user_id","entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_idx" ON "workspaces" USING btree ("slug");--> statement-breakpoint
-- has_permission()/is_workspace_member(): funciones que no se pueden
-- expresar con el DSL de Drizzle, agregadas a mano (§1.8/§1.5 de
-- ARCHITECTURE.md). Van DESPUÉS de todos los CREATE TABLE y ANTES de las
-- políticas que las usan: Postgres valida al crear una función LANGUAGE sql
-- que las tablas referenciadas ya existan. Si se regenera esta migración
-- con `drizzle-kit generate`, hay que volver a pegar este bloque en el
-- archivo nuevo.
CREATE FUNCTION has_permission(uid uuid, target_workspace_id uuid, perm_key text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT mpo.granted
      FROM membership_permission_overrides mpo
      JOIN memberships m ON m.id = mpo.membership_id
      WHERE m.user_id = uid
        AND m.workspace_id = target_workspace_id
        AND mpo.permission_key = perm_key
    ),
    EXISTS (
      SELECT 1
      FROM memberships m
      JOIN role_default_permissions rdp ON rdp.role = m.role
      WHERE m.user_id = uid
        AND m.workspace_id = target_workspace_id
        AND rdp.permission_key = perm_key
    )
  );
$$;
--> statement-breakpoint
-- SECURITY DEFINER acá no es solo por privilegio: sin esto, una política de
-- "memberships" que llama a esta función seguiría dentro del contexto RLS
-- del invocador y, al consultar memberships internamente, dispararía la
-- política de memberships de nuevo -> recursión infinita (confirmado
-- corriendo la migración contra Postgres real durante el desarrollo).
CREATE FUNCTION is_workspace_member(uid uuid, target_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.workspace_id = target_workspace_id AND m.user_id = uid
  );
$$;
--> statement-breakpoint
CREATE POLICY "event_log_select_workspace_member" ON "event_log" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from "memberships"
        where "memberships"."workspace_id" = "event_log"."workspace_id"
        and "memberships"."user_id" = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "event_log_insert_workspace_member" ON "event_log" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
        select 1 from "memberships"
        where "memberships"."workspace_id" = "event_log"."workspace_id"
        and "memberships"."user_id" = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "favorites_manage_own" ON "favorites" AS PERMISSIVE FOR ALL TO "authenticated" USING ("favorites"."user_id" = (select auth.uid())) WITH CHECK ("favorites"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "permission_overrides_manage_admin" ON "membership_permission_overrides" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (
        select 1 from "memberships" m
        join "memberships" target on target.id = "membership_permission_overrides"."membership_id"
        where m.workspace_id = target.workspace_id
        and m.user_id = (select auth.uid())
        and m.role in ('OWNER', 'ADMIN')
      ));--> statement-breakpoint
CREATE POLICY "memberships_select_workspace_peers" ON "memberships" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_workspace_member((select auth.uid()), "memberships"."workspace_id"));--> statement-breakpoint
CREATE POLICY "memberships_manage_admin" ON "memberships" AS PERMISSIVE FOR ALL TO "authenticated" USING (has_permission((select auth.uid()), "memberships"."workspace_id", 'members:invite'));--> statement-breakpoint
CREATE POLICY "notifications_select_own" ON "notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("notifications"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "notifications_mark_read_own" ON "notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("notifications"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "organizations_select_member" ON "organizations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from workspaces
        join memberships on memberships.workspace_id = workspaces.id
        where workspaces.organization_id = "organizations"."id"
        and memberships.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "permissions_select_authenticated" ON "permissions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "platform_formats_select_authenticated" ON "platform_formats" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "profiles_select_workspace_peers" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("profiles"."id" = (select auth.uid()) or exists (
        select 1 from memberships m1
        join memberships m2 on m1.workspace_id = m2.workspace_id
        where m1.user_id = (select auth.uid()) and m2.user_id = "profiles"."id"
      ));--> statement-breakpoint
CREATE POLICY "profiles_update_self" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("profiles"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "recently_viewed_manage_own" ON "recently_viewed" AS PERMISSIVE FOR ALL TO "authenticated" USING ("recently_viewed"."user_id" = (select auth.uid())) WITH CHECK ("recently_viewed"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "role_default_permissions_select_authenticated" ON "role_default_permissions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "workspaces_select_member" ON "workspaces" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (
        select 1 from memberships
        where memberships.workspace_id = "workspaces"."id"
        and memberships.user_id = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "workspaces_update_admin" ON "workspaces" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (has_permission((select auth.uid()), "workspaces"."id", 'settings:manage'));