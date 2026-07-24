import { cn } from "@/lib/cn";

interface LogoProps {
  /** Show the "cubr" wordmark next to the mark. */
  withWordmark?: boolean;
  className?: string;
}

/**
 * Brand mark: a small isometric cube built from the six cube-face colors,
 * paired with the Space Grotesk wordmark. The cube tile references the
 * palette's cube colors as first-class citizens (Section 2).
 */
export function Logo({ withWordmark = true, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* top face */}
        <path d="M14 2 26 8 14 14 2 8Z" fill="#FFD500" />
        {/* left face */}
        <path d="M2 8 14 14 14 26 2 20Z" fill="#FF5900" />
        {/* right face */}
        <path d="M26 8 14 14 14 26 26 20Z" fill="#009B48" />
        {/* seams */}
        <path
          d="M14 2 26 8 14 14 2 8Z M2 8 14 14 14 26 2 20Z M26 8 14 14 14 26 26 20Z"
          stroke="#0D0E10"
          strokeWidth="0.75"
          strokeOpacity="0.35"
          fill="none"
        />
      </svg>
      {withWordmark && (
        <span className="font-display text-heading-sm font-bold tracking-tight text-text-primary">
          cubr
        </span>
      )}
    </div>
  );
}
