import { Bell, Search } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/**
 * Top bar: search field + notifications icon + avatar.
 * Uses theme-aware .cubr-topbar class from globals.css.
 */
export function TopBar() {
  return (
    <header className="cubr-topbar sticky top-0 z-20 flex items-center gap-4 px-4 py-3 md:px-8">
      <label className="relative flex-1 max-w-md">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
        />
        <input
          type="search"
          placeholder="Search algorithms, guides, solves…"
          className="cubr-input h-10 w-full pl-10 pr-4 text-body-sm text-text-primary placeholder:text-text-tertiary outline-none"
        />
      </label>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-raised text-text-secondary transition-colors hover:text-text-primary hover:border-border-strong"
        >
          <Bell size={18} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand ring-2 ring-bg-default" />
        </button>
        <button
          type="button"
          aria-label="Account"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-label-md font-semibold text-text-on-brand"
        >
          MX
        </button>
      </div>
    </header>
  );
}
