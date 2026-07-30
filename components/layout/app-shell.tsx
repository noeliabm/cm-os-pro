"use client";

import { useEffect, useState } from "react";
import { Sidebar, type SidebarWorkspace } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import type { NotificationItem } from "./notification-bell";

export function AppShell({
  workspace,
  workspaces,
  userEmail,
  notifications,
  unreadCount,
  children,
}: {
  workspace: SidebarWorkspace | null;
  workspaces: SidebarWorkspace[];
  userEmail: string | undefined;
  notifications: NotificationItem[];
  unreadCount: number;
  children: React.ReactNode;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar workspace={workspace} workspaces={workspaces} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          userEmail={userEmail}
          notifications={notifications}
          unreadCount={unreadCount}
          onOpenCommandPalette={() => setPaletteOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
