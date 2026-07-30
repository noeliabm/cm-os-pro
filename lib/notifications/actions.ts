"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { notifications } from "@/drizzle/schema";
import { withRLS } from "@/lib/db";
import { requireAuthContext } from "@/lib/auth/context";

export async function markNotificationReadAction(notificationId: string) {
  const { claims } = await requireAuthContext();
  await withRLS(claims, (tx) =>
    tx.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, notificationId)),
  );
  revalidatePath("/", "layout");
}
