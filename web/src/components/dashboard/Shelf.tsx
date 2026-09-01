import { ShelfCard } from "./ShelfCard";
import type { Shelf as ShelfData } from "@/types/home";

/**
 * Content shelf (Section 6.4): a heading over a horizontally-scrollable row of
 * cards, browsable by theme. Overflow scrolls within its own container so the
 * page body never scrolls horizontally.
 */
export function Shelf({ shelf }: { shelf: ShelfData }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="type-heading-sm text-text-primary">{shelf.heading}</h2>
        <span className="type-caption text-text-tertiary">{shelf.items.length} items</span>
      </div>
      <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
        {shelf.items.map((item) => (
          <ShelfCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
