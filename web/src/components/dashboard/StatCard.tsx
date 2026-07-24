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
        "flex min-w-40 flex-1 flex-col gap-1 rounded-xl border border-border bg-surface-raised px-5 py-4",
        className
      )}
    >
      <span className="type-caption text-text-tertiary">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-heading-lg font-bold text-brand">{value}</span>
        {hint && <span className="type-body-sm text-text-secondary">{hint}</span>}
      </div>
    </div>
  );
}
