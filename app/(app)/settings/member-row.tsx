"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { changeMemberRoleAction, removeMemberAction } from "./members-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Member {
  membershipId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
  name: string | null;
  avatarUrl: string | null;
  joinedAt: Date;
}

export function MemberRow({ member, canManage }: { member: Member; canManage: boolean }) {
  const roleFormRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{(member.name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{member.name ?? "Sin nombre"}</p>
          <p className="text-muted-foreground text-xs">
            Desde {member.joinedAt.toLocaleDateString("es-AR")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <form ref={roleFormRef} action={changeMemberRoleAction}>
          <input type="hidden" name="membershipId" value={member.membershipId} />
          <Select
            name="role"
            defaultValue={member.role}
            disabled={!canManage || member.role === "OWNER"}
            onValueChange={() => roleFormRef.current?.requestSubmit()}
          >
            <SelectTrigger size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OWNER" disabled>
                Owner
              </SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="EDITOR">Editor</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </form>

        {canManage && member.role !== "OWNER" && (
          <form action={removeMemberAction}>
            <input type="hidden" name="membershipId" value={member.membershipId} />
            <Button variant="ghost" size="icon" type="submit" aria-label="Quitar miembro">
              <X className="text-muted-foreground size-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
