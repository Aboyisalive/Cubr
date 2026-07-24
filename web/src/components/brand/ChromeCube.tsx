import { cn } from "@/lib/cn";

interface ChromeCubeProps {
  /** Square edge length in px. Ignored when `fill` is set. */
  size?: number;
  /** Fill the parent's width as a square (for responsive card art). */
  fill?: boolean;
  /** Corner radius token class, e.g. "rounded-lg". */
  radiusClass?: string;
  className?: string;
}

/**
 * The chrome/metallic material (Section 5): a diagonal specular sweep through the
 * chrome ramp, with an isometric cube etched on top. Reserved for cube imagery —
 * card art, the mini-bar swatch, and (eventually) real 3D render surfaces. It must
 * NOT be used as general UI chrome.
 */
export function ChromeCube({
  size = 56,
  fill = false,
  radiusClass = "rounded-lg",
  className,
}: ChromeCubeProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-chrome-gradient",
        "ring-1 ring-white/10 shadow-md shadow-black/20",
        fill && "aspect-square w-full",
        radiusClass,
        className
      )}
      style={fill ? undefined : { width: size, height: size }}
      aria-hidden="true"
    >
      {/* specular highlight streak */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent" />
      {/* etched isometric cube */}
      <svg
        viewBox="0 0 28 28"
        className="absolute inset-0 h-full w-full p-[18%]"
        fill="none"
      >
        <path d="M14 3 25 8.5 14 14 3 8.5Z" fill="#ffffff" fillOpacity="0.55" />
        <path d="M3 8.5 14 14 14 25 3 19.5Z" fill="#000000" fillOpacity="0.22" />
        <path d="M25 8.5 14 14 14 25 25 19.5Z" fill="#000000" fillOpacity="0.10" />
        <path
          d="M14 3 25 8.5 14 14 3 8.5Z M3 8.5 14 14 14 25 3 19.5Z M25 8.5 14 14 14 25 25 19.5Z"
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="0.6"
        />
      </svg>
    </div>
  );
}
