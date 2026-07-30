"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Search, Sun } from "lucide-react";
import { NAV_SECTIONS } from "./nav-config";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOutAction } from "@/lib/auth/actions";
import { NotificationBell, type NotificationItem } from "./notification-bell";

const ALL_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

export function Topbar({
  userEmail,
  notifications,
  unreadCount,
  onOpenCommandPalette,
}: {
  userEmail: string | undefined;
  notifications: NotificationItem[];
  unreadCount: number;
  onOpenCommandPalette: () => void;
}) {
  const pathname = usePathname();
  const current = ALL_ITEMS.find((item) => pathname.startsWith(item.href));
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-5">
      <p className="text-sm font-medium">{current?.label ?? "CM OS Pro"}</p>

      <div className="flex flex-1 items-center justify-end gap-2">
        <button
          onClick={onOpenCommandPalette}
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex w-56 items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors"
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">Buscar…</span>
          <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Cambiar tema</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cambiar tema</TooltipContent>
        </Tooltip>

        <NotificationBell notifications={notifications} unreadCount={unreadCount} />

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none">
            <Avatar className="size-7">
              <AvatarFallback>
                {userEmail?.charAt(0).toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-muted-foreground truncate text-xs font-normal">
              {userEmail}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings">Configuración</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOutAction}>
              <button type="submit" className="w-full">
                <DropdownMenuItem variant="destructive" asChild>
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
