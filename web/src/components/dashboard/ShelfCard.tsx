import { Link } from "react-router-dom";
import { ChromeCube } from "@/components/brand/ChromeCube";
import type { ShelfCardItem } from "@/types/home";

/**
 * Reusable content-shelf card (Section 6, "components already built"):
 * chrome-gradient thumbnail + title + one line of metadata. Image-forward,
 * minimal text. The chrome art is legitimate here — it's cube imagery (Section 5).
 */
export function ShelfCard({ item }: { item: ShelfCardItem }) {
  return (
    <Link
      to={item.href}
      className="group flex w-44 shrink-0 flex-col gap-3 rounded-xl border border-border bg-surface-raised p-3 transition-colors hover:border-border-strong"
    >
      <ChromeCube fill radiusClass="rounded-lg" />
      <div className="min-w-0">
        <p className="type-label-md truncate text-text-primary">{item.title}</p>
        <p className="type-body-sm truncate text-text-secondary">{item.subtitle}</p>
      </div>
    </Link>
  );
}
