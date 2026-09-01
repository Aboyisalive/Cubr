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
    <nav className="cubr-bottombar fixed inset-x-0 bottom-0 z-40 border-t border-white/10 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-16px_40px_rgba(0,0,0,0.38)] md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1.5">
        {ITEMS.map(({ to, icon: Icon, label, end, isAction }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-end gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-medium transition-all",
                isAction && "relative -translate-y-1.5",
                isActive ? "text-brand" : "text-text-tertiary hover:text-text-secondary"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isAction ? (
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-[20px] border border-brand/30",
                      "bg-gradient-to-br from-brand to-brand/80 text-text-on-brand shadow-[0_10px_30px_rgba(255,130,60,0.4)]",
                      "transition-transform active:scale-95"
                    )}
                  >
                    <Icon size={22} />
                  </div>
                ) : (
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      isActive ? "bg-brand/12 text-brand" : "bg-transparent text-current"
                    )}
                  >
                    <Icon size={17} className={cn("transition-colors", isActive ? "text-brand" : "text-current")} />
                  </div>
                )}
                <span className={cn(isAction && "mt-0.5")}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
