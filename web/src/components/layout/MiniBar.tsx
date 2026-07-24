import { Play, X } from "lucide-react";
import { ChromeCube } from "@/components/brand/ChromeCube";
import { Button } from "@/components/ui/Button";
import { useUiStore } from "@/store/uiStore";

/**
 * Persistent bottom mini-bar (Section 6.6) — Spotify now-playing / YouTube
 * mini-player analog. Reflects the current active session on every screen with a
 * quick Resume action. Chrome-gradient cube swatch is the one chrome touch here.
 */
export function MiniBar() {
  const session = useUiStore((s) => s.session);
  const setSession = useUiStore((s) => s.setSession);

  if (!session) return null;

  return (
    <div className="shrink-0 border-t border-border-subtle px-4 py-3 md:px-8">
      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface-raised px-3 py-2.5">
        <ChromeCube size={44} radiusClass="rounded-md" />

        <div className="min-w-0">
          <p className="type-label-md truncate text-text-primary">{session.label}</p>
          <p className="type-body-sm truncate text-text-secondary">{session.detail}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button size="md" className="gap-2">
            <Play size={18} />
            <span className="hidden sm:inline">Resume</span>
          </Button>
          <button
            type="button"
            aria-label="End session"
            onClick={() => setSession(null)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-surface-sunken hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
