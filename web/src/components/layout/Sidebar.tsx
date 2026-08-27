import { useNavigate } from "react-router-dom";
import { ScanLine } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NavItem } from "./NavItem";
import { Button } from "@/components/ui/Button";
import { NAV_DESTINATIONS } from "@/config/nav";

/**
 * Persistent left sidebar rail. Hidden on mobile (BottomNav takes over).
 * Uses theme-aware .cubr-sidebar class from globals.css.
 */
export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="cubr-sidebar hidden md:flex w-64 shrink-0 flex-col gap-6 px-4 py-5">
      <div className="px-2">
        <Logo />
      </div>

      <Button
        size="lg"
        className="w-full justify-start gap-3"
        onClick={() => navigate("/app/scan")}
      >
        <ScanLine size={20} />
        Scan Cube
      </Button>

      <nav className="flex flex-col gap-1">
        <p className="type-caption px-3 pb-1 text-text-tertiary">Browse</p>
        {NAV_DESTINATIONS.map((d) => (
          <NavItem key={d.to} to={d.to} label={d.label} icon={d.icon} end={d.to === "/app"} />
        ))}
      </nav>
    </aside>
  );
}
