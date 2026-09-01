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
      className="group flex w-44 shrink-0 flex-col gap-3 rounded-[24px] border border-white/10 bg-white/5 p-3 shadow-[0_16px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-brand/25 hover:bg-white/8"
    >
      <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-2">
        <ChromeCube fill radiusClass="rounded-[14px]" className="shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" />
      </div>
      <div className="min-w-0">
        <p className="type-label-md truncate text-text-primary">{item.title}</p>
        <p className="type-body-sm mt-1 truncate text-text-secondary">{item.subtitle}</p>
      </div>
    </Link>
  );
}
