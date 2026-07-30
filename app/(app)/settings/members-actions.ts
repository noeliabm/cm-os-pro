"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { memberships, roleEnum } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { withRLS } from "@/lib/db";
import { requireAuthContext } from "@/lib/auth/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { dispatchEvent } from "@/lib/events/dispatch";

export interface MemberFormState {
  error?: string;
}

const inviteSchema = z.object({
  workspaceId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(roleEnum),
});

/**
 * No se pudo probar contra un proyecto Supabase real (no hay credenciales
 * en este entorno) — requiere SUPABASE_SERVICE_ROLE_KEY para invitar por
 * email vía `auth.admin.inviteUserByEmail`. Si el usuario ya existe,
 * Supabase devuelve error y se lo busca por email para reusar su id en vez
 * de fallar — comportamiento esperado según la documentación de la Admin
 * API, no verificado en vivo.
 */
export async function inviteMemberAction(
  _prevState: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  const parsed = inviteSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { workspaceId, email, role } = parsed.data;
  const { claims } = await requireAuthContext();

  const admin = createSupabaseAdminClient();
  let userId: string;

  const invited = await admin.auth.admin.inviteUserByEmail(email);
  if (invited.error) {
    const { data: existing } = await admin.auth.admin.listUsers();
    const match = existing?.users.find((u) => u.email === email);
    if (!match) return { error: invited.error.message };
    userId = match.id;
  } else {
    userId = invited.data.user.id;
  }

  try {
    await withRLS(claims, async (tx) => {
      const [membership] = await tx
        .insert(memberships)
        .values({ userId, workspaceId, role })
        .returning();

      await dispatchEvent(tx, {
        type: "membership.created",
        workspaceId,
        actorId: claims.sub,
        payload: { membershipId: membership.id, userId, email, role },
      });
    });
  } catch {
    return { error: "No tenés permiso para invitar miembros en este workspace" };
  }

  revalidatePath("/settings");
  return {};
}

const roleChangeSchema = z.object({
  membershipId: z.string().uuid(),
  role: z.enum(roleEnum),
});

export async function changeMemberRoleAction(formData: FormData) {
  const parsed = roleChangeSchema.parse({
    membershipId: formData.get("membershipId"),
    role: formData.get("role"),
  });
  const { claims } = await requireAuthContext();

  await withRLS(claims, (tx) =>
    tx.update(memberships).set({ role: parsed.role }).where(eq(memberships.id, parsed.membershipId)),
  );

  revalidatePath("/settings");
}

export async function removeMemberAction(formData: FormData) {
  const membershipId = z.string().uuid().parse(formData.get("membershipId"));
  const { claims } = await requireAuthContext();

  await withRLS(claims, (tx) => tx.delete(memberships).where(eq(memberships.id, membershipId)));

  revalidatePath("/settings");
}
