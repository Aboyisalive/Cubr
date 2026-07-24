import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// Flat semantic colors only — buttons never wear the chrome gradient (Section 5).
const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-text-on-brand hover:bg-brand-hover shadow-sm shadow-black/10",
  secondary:
    "bg-surface-raised text-text-primary border border-border hover:border-border-strong",
  ghost: "bg-transparent text-text-secondary hover:bg-surface-raised hover:text-text-primary",
  danger: "bg-status-danger text-white hover:brightness-95",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-label-md gap-2 rounded-md",
  md: "h-10 px-4 text-label-md gap-2 rounded-lg",
  lg: "h-12 px-5 text-label-lg gap-2 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap font-body font-semibold",
        "transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
