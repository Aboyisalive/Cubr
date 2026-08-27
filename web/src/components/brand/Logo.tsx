import { cn } from "@/lib/cn";
import logoImg from "@/assets/logo.png";

interface LogoProps {
  withWordmark?: boolean;
  className?: string;
}

export function Logo({ withWordmark = true, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
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
