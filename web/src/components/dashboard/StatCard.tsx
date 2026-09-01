import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: string;
  /** Optional trailing context, e.g. "PB" or "days". */
  hint?: string;
  className?: string;
}

/**
 * Quick-stat card (Section 6.5): numeral in brand orange on an elevated surface.
 * Gives the dashboard an immediate data-forward feel. Flat surface, no chrome.
 */
export function StatCard({ label, value, hint, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-2 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl",
        className
      )}
    >
      <span className="type-caption text-text-tertiary">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-none tracking-[-0.05em] text-brand">{value}</span>
        {hint && <span className="type-body-sm text-text-secondary">{hint}</span>}
      </div>
    </div>
  );
}
