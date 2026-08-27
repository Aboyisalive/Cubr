import { cn } from "@/lib/cn";
import logoImg from "@/assets/logo.png";

interface LogoProps {
  withWordmark?: boolean;
  compact?: boolean;
  className?: string;
}

export function Logo({ withWordmark = true, compact = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center select-none", compact ? "gap-1.5" : "gap-3", className)}>
      <img
        src={logoImg}
        alt="cubr logo"
        className="h-12 w-12 shrink-0 object-contain"
      />
      {withWordmark && (
        <span className="font-display text-heading-sm font-bold tracking-tight text-text-primary">
          cubr
        </span>
      )}
    </div>
  );
}
