"use client";

import { useRouter } from "next/navigation";
import { Moon, Sun, Star, Clock, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV_SECTIONS } from "./nav-config";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();

  function go(href: string) {
    router.push(href);
    onOpenChange(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar módulos, ideas, contenido…" />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>
        {NAV_SECTIONS.map((section) => (
          <CommandGroup key={section.label} heading={section.label}>
            {section.items.map((item) => (
              <CommandItem key={item.href} onSelect={() => go(item.href)}>
                <item.icon className="size-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        <CommandSeparator />
        <CommandGroup heading="Accesos rápidos">
          <CommandItem onSelect={() => go("/favorites")}>
            <Star className="size-4" />
            Favoritos
          </CommandItem>
          <CommandItem onSelect={() => go("/recently-viewed")}>
            <Clock className="size-4" />
            Vistos recientemente
          </CommandItem>
          <CommandItem onSelect={() => go("/trash")}>
            <Trash2 className="size-4" />
            Papelera
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Apariencia">
          <CommandItem onSelect={() => setTheme("light")}>
            <Sun className="size-4" />
            Tema claro
          </CommandItem>
          <CommandItem onSelect={() => setTheme("dark")}>
            <Moon className="size-4" />
            Tema oscuro
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
