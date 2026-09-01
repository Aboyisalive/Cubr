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
          "group flex h-11 items-center gap-3 rounded-2xl px-3 text-label-md transition-all",
          isActive
            ? "border border-brand/30 bg-brand/12 text-brand shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
            : "border border-transparent text-text-secondary hover:border-white/10 hover:bg-white/5 hover:text-text-primary"
        )
      }
    >
      {({ isActive }) => (
        <>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl",
              isActive ? "bg-brand/12" : "bg-white/5"
            )}
          >
            <Icon
              size={17}
              className={isActive ? "text-brand" : "text-text-tertiary group-hover:text-text-primary"}
            />
          </div>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
