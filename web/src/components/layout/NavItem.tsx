import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItemProps {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Match the route exactly (used for the index "Home" destination). */
  end?: boolean;
}

/**
 * Reusable sidebar nav row (Section 6, "components already built").
 * Flat semantic colors only. Active state uses brand-subtle fill + brand text;
 * there is no chrome gradient here (Section 5).
 */
export function NavItem({ to, label, icon: Icon, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-lg px-3 h-10",
          "text-label-md transition-colors",
          isActive
            ? "bg-brand-subtle text-brand"
            : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={20}
            className={isActive ? "text-brand" : "text-text-tertiary group-hover:text-text-primary"}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
