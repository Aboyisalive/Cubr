import type { LucideIcon } from "lucide-react";
import { ChromeCube } from "@/components/brand/ChromeCube";

interface PagePlaceholderProps {
  icon: LucideIcon;
  title: string;
  phase: string;
  blurb: string;
}

/**
 * On-brand placeholder for roadmap screens whose function arrives in a later phase.
 * Keeps the shell navigable now while signalling what's coming. Single background;
 * the only chrome is the cube art.
 */
export function PagePlaceholder({ icon: Icon, title, phase, blurb }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <ChromeCube size={96} radiusClass="rounded-2xl" />
      <div className="flex flex-col items-center gap-2">
        <span className="type-caption rounded-full border border-border px-3 py-1 text-text-tertiary">
          {phase}
        </span>
        <h1 className="type-heading-lg flex items-center gap-3 text-text-primary">
          <Icon className="text-brand" size={28} />
          {title}
        </h1>
        <p className="type-body-md max-w-md text-text-secondary">{blurb}</p>
      </div>
    </div>
  );
}
