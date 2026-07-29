"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, Clock, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "./nav-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SidebarWorkspace {
  id: string;
  name: string;
}

export function Sidebar({
  workspace,
  workspaces,
}: {
  workspace: SidebarWorkspace | null;
  workspaces: SidebarWorkspace[];
}) {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border flex h-screen w-60 shrink-0 flex-col border-r">
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="hover:bg-sidebar-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors outline-none">
            <span className="flex size-5 shrink-0 items-center justify-center rounded bg-foreground text-background text-[11px] font-semibold">
              {workspace?.name.charAt(0).toUpperCase() ?? "?"}
            </span>
            <span className="flex-1 truncate">{workspace?.name ?? "Elegir workspace"}</span>
            <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {workspaces.length === 0 && (
              <p className="text-muted-foreground px-2 py-1.5 text-sm">
                Todavía no creaste ninguno
              </p>
            )}
            {workspaces.map((w) => (
              <DropdownMenuItem key={w.id}>{w.name}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="text-muted-foreground/70 px-2 pb-1 text-[11px] font-medium tracking-wide uppercase">
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-sidebar-border flex flex-col gap-0.5 border-t p-3">
        <SidebarUtilityLink href="/favorites" icon={Star} label="Favoritos" />
        <SidebarUtilityLink href="/recently-viewed" icon={Clock} label="Recientes" />
        <SidebarUtilityLink href="/trash" icon={Trash2} label="Papelera" />
      </div>
    </aside>
  );
}

function SidebarUtilityLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Star;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors"
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      <span>{label}</span>
    </Link>
  );
}
