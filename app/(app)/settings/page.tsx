import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { getPrimaryWorkspace } from "@/server/services/workspaces";
import { getWorkspaceMembers } from "@/server/services/members";
import { checkPermission } from "@/lib/permissions/check";
import { MemberRow } from "./member-row";
import { InviteForm } from "./invite-form";

export default async function SettingsPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const workspace = await getPrimaryWorkspace(auth.claims);
  if (!workspace) {
    return (
      <p className="text-muted-foreground py-20 text-center text-sm">
        Todavía no pertenecés a ningún workspace.
      </p>
    );
  }

  const [members, canManageMembers] = await Promise.all([
    getWorkspaceMembers(auth.claims, workspace.id),
    checkPermission(auth.claims, workspace.id, "members:invite"),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 py-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl italic">Miembros</h1>
        <p className="text-muted-foreground text-sm">{workspace.name}</p>
      </div>

      {canManageMembers && <InviteForm workspaceId={workspace.id} />}

      <div className="divide-y">
        {members.map((member) => (
          <MemberRow key={member.membershipId} member={member} canManage={canManageMembers} />
        ))}
      </div>
    </div>
  );
}
