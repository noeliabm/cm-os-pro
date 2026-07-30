import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { getAuthContext } from "@/lib/auth/context";
import { getPrimaryWorkspace } from "@/server/services/workspaces";
import { getRecentlyViewed } from "@/server/services/recently-viewed";
import { ComingSoon } from "@/components/shared/coming-soon";

export default async function RecentlyViewedPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const workspace = await getPrimaryWorkspace(auth.claims);
  const items = workspace ? await getRecentlyViewed(auth.claims, workspace.id) : [];

  if (items.length === 0) {
    return (
      <ComingSoon
        icon={Clock}
        title="Sin actividad reciente"
        description="Todo lo que abras va a quedar registrado acá — el módulo que produce esas vistas todavía no existe."
      />
    );
  }

  return (
    <ul className="mx-auto flex max-w-2xl flex-col gap-2 py-4">
      {items.map((item) => (
        <li key={item.id} className="text-sm">
          {item.entityType} · {item.entityId}
        </li>
      ))}
    </ul>
  );
}
