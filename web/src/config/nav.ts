import { Home, Boxes, GraduationCap, Gauge, Palette, Settings, type LucideIcon } from "lucide-react";

export interface NavDestination {
  label: string;
  to: string;
  icon: LucideIcon;
}

/**
 * Nav items are DESTINATIONS you browse and return to.
 * Actions the user triggers (Scan Cube) are CTA buttons, NOT nav items.
 */
export const NAV_DESTINATIONS: NavDestination[] = [
  { label: "Home", to: "/app", icon: Home },
  { label: "Solver", to: "/app/solver", icon: Boxes },
  { label: "Guide", to: "/app/guide", icon: GraduationCap },
  { label: "Pro Mode", to: "/app/pro", icon: Gauge },
  { label: "Themes", to: "/app/themes", icon: Palette },
  { label: "Settings", to: "/app/settings", icon: Settings },
];
