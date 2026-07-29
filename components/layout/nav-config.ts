import {
  LayoutDashboard,
  FileText,
  BookOpen,
  LayoutTemplate as MoodboardIcon,
  Sparkles,
  Lightbulb,
  GalleryHorizontal,
  CalendarDays,
  Grid3x3,
  Megaphone,
  FolderOpen,
  MessagesSquare,
  Users,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * Fuente única de la navegación principal — agrupada en secciones en vez de
 * una lista plana de ~19 ítems (si el sidebar se siente cargado, se agrupa
 * antes que comprimir filas). Command Palette (§ command-palette.tsx) usa
 * el mismo catálogo para no duplicar la lista de módulos.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/brief", label: "Brief", icon: FileText },
      { href: "/ideas", label: "Ideas", icon: Lightbulb },
      { href: "/content", label: "Contenido", icon: GalleryHorizontal },
      { href: "/calendar", label: "Calendario", icon: CalendarDays },
    ],
  },
  {
    label: "Creatividad",
    items: [
      { href: "/manual", label: "Manual maestro", icon: BookOpen },
      { href: "/moodboard", label: "Moodboard", icon: MoodboardIcon },
      { href: "/inspiration", label: "Inspiración", icon: Sparkles },
      { href: "/feed-builder", label: "Vista previa de feed", icon: Grid3x3 },
    ],
  },
  {
    label: "Organización",
    items: [
      { href: "/campaigns", label: "Campañas", icon: Megaphone },
      { href: "/resources", label: "Recursos", icon: FolderOpen },
      { href: "/copies", label: "Banco de copies", icon: MessagesSquare },
      { href: "/competitors", label: "Competencia", icon: Users },
      { href: "/stats", label: "Estadísticas", icon: BarChart3 },
    ],
  },
];
