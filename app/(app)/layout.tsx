import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { getWorkspacesForUser, getPrimaryWorkspace } from "@/server/services/workspaces";
import { getRecentNotifications, getUnreadCount } from "@/server/services/notifications";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const workspaces = await getWorkspacesForUser(auth.claims);
  const workspace = await getPrimaryWorkspace(auth.claims);

  const [notifications, unreadCount] = workspace
    ? await Promise.all([
        getRecentNotifications(auth.claims, workspace.id),
        getUnreadCount(auth.claims, workspace.id),
      ])
    : [[], 0];

  return (
    <AppShell
      workspace={workspace}
      workspaces={workspaces}
      userEmail={auth.email}
      notifications={notifications}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
