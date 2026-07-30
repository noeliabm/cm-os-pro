"use client";

import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { markNotificationReadAction } from "@/lib/notifications/actions";
import { describeEvent } from "@/lib/events/describe";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  type: string;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
}

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="bg-foreground text-background absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full text-[9px] font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-medium">Notificaciones</p>
        </div>
        {notifications.length === 0 ? (
          <p className="text-muted-foreground px-4 py-6 text-center text-sm">
            No tenés notificaciones todavía
          </p>
        ) : (
          <div className="max-h-80 divide-y overflow-y-auto">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                disabled={isPending || !!notification.readAt}
                onClick={() =>
                  startTransition(() => markNotificationReadAction(notification.id))
                }
                className={cn(
                  "hover:bg-accent flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors",
                  !notification.readAt && "bg-accent/40",
                )}
              >
                <p className="text-sm">
                  {describeEvent(notification.type, notification.payload)}
                </p>
                <p className="text-muted-foreground text-xs">
                  {notification.createdAt.toLocaleString("es-AR")}
                </p>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
