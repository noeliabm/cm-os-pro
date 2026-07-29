import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformContentItem } from "../types";

/**
 * Implementación mínima del contrato `FeedPreviewComponent` para Instagram:
 * grilla 3 columnas, 1:1. El Constructor de Feed completo (drag & drop con
 * @dnd-kit, ver §1.7/roadmap Fase 3) se construye sobre esta base.
 */
export function InstagramFeedPreview({ items }: { items: PlatformContentItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center rounded-lg border border-dashed text-sm">
        Sin publicaciones todavía
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "bg-muted relative aspect-square overflow-hidden",
            item.hidden && "opacity-40",
          )}
        >
          {item.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center">
              <ImageOff className="size-5" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
