import { Bell, Search } from "lucide-react";

/**
 * Premium header for the glass dashboard shell.
 */
export function TopBar() {
  return (
    <header className="cubr-topbar sticky top-0 z-30 flex items-center gap-3 px-4 py-3 md:px-8">
      <div className="flex items-center gap-3 md:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-brand/15 font-display text-sm font-semibold text-brand shadow-[0_0_30px_rgba(255,130,60,0.25)]">
          C
        </div>
        <div className="leading-none">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-text-tertiary">cubr</p>
          <p className="mt-1 text-sm font-medium text-text-primary">Good evening</p>
        </div>
      </div>

      <label className="relative hidden flex-1 max-w-md md:flex">
        <Search
          size={17}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
        />
        <input
          type="search"
          placeholder="Search algorithms, guides, solves…"
          className="cubr-input h-11 w-full rounded-2xl pl-10 pr-4 text-body-sm text-text-primary placeholder:text-text-tertiary outline-none"
        />
      </label>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-text-secondary transition-all hover:border-white/20 hover:text-text-primary"
        >
          <Bell size={17} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand ring-2 ring-[#11151b]" />
        </button>
        <button
          type="button"
          aria-label="Account"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand/30 bg-gradient-to-br from-brand/80 to-brand/55 text-sm font-semibold text-text-on-brand shadow-[0_0_24px_rgba(255,134,71,0.22)]"
        >
          MX
        </button>
      </div>
    </header>
  );
}
