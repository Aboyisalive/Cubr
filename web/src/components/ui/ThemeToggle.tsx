import { Moon, Sun } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { cn } from "@/lib/cn";

/** Light/dark are equal peers (Section 2) — this simply swaps between them. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-lg",
        "bg-surface-raised text-text-secondary border border-border",
        "transition-colors hover:text-text-primary hover:border-border-strong",
        className
      )}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
