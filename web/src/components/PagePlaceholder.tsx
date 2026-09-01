import type { LucideIcon } from "lucide-react";
import { ChromeCube } from "@/components/brand/ChromeCube";
import { StatCard } from "@/components/dashboard/StatCard";

interface PagePlaceholderProps {
  icon: LucideIcon;
  title: string;
  phase: string;
  blurb: string;
}

/**
 * Generic shell for secondary app pages so they sit inside the same dashboard-first layout.
 */
export function PagePlaceholder({ icon: Icon, title, phase, blurb }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col gap-10 px-4 py-6 md:px-8">
      <header className="flex flex-col gap-1">
        <p className="type-caption text-text-tertiary">{phase}</p>
        <h1 className="type-heading-lg flex items-center gap-3 text-text-primary">
          <Icon className="text-brand" size={28} />
          {title}
        </h1>
      </header>

      <div className="flex flex-wrap gap-4">
        <StatCard label="Status" value="Draft" />
        <StatCard label="Focus" value="Roadmap" />
        <StatCard label="Priority" value="Later" />
      </div>

      <section className="rounded-2xl border border-border bg-surface-raised p-6">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <ChromeCube size={96} radiusClass="rounded-2xl" />
          <div className="flex max-w-xl flex-col items-center gap-2">
            <p className="type-caption text-text-tertiary">{phase}</p>
            <p className="type-body-md text-text-secondary">{blurb}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
