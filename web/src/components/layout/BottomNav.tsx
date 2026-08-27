import { NavLink } from "react-router-dom";
import { Home, Boxes, GraduationCap, Gauge, ScanLine } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { to: "/app", icon: Home, label: "Home", end: true },
  { to: "/app/scan", icon: ScanLine, label: "Scan", isAction: true },
  { to: "/app/solver", icon: Boxes, label: "Solver" },
  { to: "/app/guide", icon: GraduationCap, label: "Learn" },
  { to: "/app/pro", icon: Gauge, label: "Pro" },
];

/**
 * Mobile bottom navigation bar. Hidden on md+ screens where Sidebar takes over.
 * Uses the theme-aware .cubr-bottombar class from globals.css.
 */
export function BottomNav() {
  return (
    <nav className="cubr-bottombar md:hidden flex items-center justify-around px-2 py-1 safe-bottom">
      {ITEMS.map(({ to, icon: Icon, label, end, isAction }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-caption transition-colors",
              isAction && "relative -mt-4",
              isActive
                ? "text-brand"
                : "text-text-tertiary hover:text-text-secondary"
            )
          }
        >
          {({ isActive }) => (
            <>
              {isAction ? (
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full",
                    "bg-brand text-text-on-brand shadow-lg shadow-brand/30",
                    "transition-transform active:scale-95"
                  )}
                >
                  <Icon size={22} />
                </div>
              ) : (
                <Icon
                  size={20}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-brand" : "text-current"
                  )}
                />
              )}
              <span className={cn(isAction && "mt-0.5")}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
