import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { getWorkspacesForUser } from "@/server/services/workspaces";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const workspaces = await getWorkspacesForUser(auth.claims);

  return (
    <AppShell
      workspace={workspaces[0] ?? null}
      workspaces={workspaces}
      userEmail={auth.email}
    >
      {children}
    </AppShell>
  );
}
