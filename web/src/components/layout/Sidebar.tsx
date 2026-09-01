import { useNavigate } from "react-router-dom";
import { ScanLine } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NavItem } from "./NavItem";
import { Button } from "@/components/ui/Button";
import { NAV_DESTINATIONS } from "@/config/nav";

/**
 * Glass sidebar rail for the desktop shell.
 */
export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="cubr-sidebar hidden w-72 shrink-0 flex-col gap-6 px-4 py-5 md:flex">
      <div className="px-2 pb-2">
        <Logo />
      </div>

      <Button
        size="lg"
        className="w-full justify-start gap-3 rounded-2xl border border-white/10 bg-brand/18 text-white shadow-[0_0_32px_rgba(255,134,71,0.12)] hover:bg-brand/24"
        onClick={() => navigate("/app/scan")}
      >
        <ScanLine size={18} />
        Scan Cube
      </Button>

      <nav className="flex flex-1 flex-col gap-2">
        <p className="type-caption px-3 pb-1 text-text-tertiary">Browse</p>

        <div className="flex flex-col gap-2">
          {NAV_DESTINATIONS.filter((destination) => destination.label !== "Settings").map((destination) => (
            <NavItem
              key={destination.to}
              to={destination.to}
              label={destination.label}
              icon={destination.icon}
              end={destination.to === "/app"}
            />
          ))}
        </div>

        <div className="mt-auto pt-2">
          {NAV_DESTINATIONS.filter((destination) => destination.label === "Settings").map((destination) => (
            <NavItem
              key={destination.to}
              to={destination.to}
              label={destination.label}
              icon={destination.icon}
              end={destination.to === "/app"}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
}
