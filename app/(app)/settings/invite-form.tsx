"use client";

import { useActionState } from "react";
import { inviteMemberAction, type MemberFormState } from "./members-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: MemberFormState = {};

export function InviteForm({ workspaceId }: { workspaceId: string }) {
  const [state, formAction, isPending] = useActionState(inviteMemberAction, initialState);

  return (
    <form action={formAction} className="flex items-start gap-2">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <Input name="email" type="email" placeholder="email@marca.com" required className="w-64" />
      <Select name="role" defaultValue="EDITOR">
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ADMIN">Admin</SelectItem>
          <SelectItem value="EDITOR">Editor</SelectItem>
          <SelectItem value="VIEWER">Viewer</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Invitando…" : "Invitar"}
      </Button>
      {state.error && <p className="text-destructive self-center text-sm">{state.error}</p>}
    </form>
  );
}
