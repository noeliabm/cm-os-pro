import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { getAuthContext } from "@/lib/auth/context";
import { getPrimaryWorkspace } from "@/server/services/workspaces";
import { getFavorites } from "@/server/services/favorites";
import { ComingSoon } from "@/components/shared/coming-soon";

export default async function FavoritesPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const workspace = await getPrimaryWorkspace(auth.claims);
  const favorites = workspace ? await getFavorites(auth.claims, workspace.id) : [];

  if (favorites.length === 0) {
    return (
      <ComingSoon
        icon={Star}
        title="Sin favoritos todavía"
        description="Marcá ideas, contenido o recursos con la estrella para encontrarlos acá rápido — el módulo que los produce todavía no existe."
      />
    );
  }

  return (
    <ul className="mx-auto flex max-w-2xl flex-col gap-2 py-4">
      {favorites.map((favorite) => (
        <li key={favorite.id} className="text-sm">
          {favorite.entityType} · {favorite.entityId}
        </li>
      ))}
    </ul>
  );
}
