import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardVariant = "default" | "outlined" | "filled";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

/**
 * Theme-aware card. Uses CSS classes that resolve differently under each visual theme:
 * - Liquid Glass: translucent surface with backdrop-blur + glass highlight
 * - Material 3: tonal surface with elevation shadow
 * - Default: existing border + bg-surface-raised
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "cubr-surface",
        "p-5",
        variant === "outlined" && "border-border",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";
