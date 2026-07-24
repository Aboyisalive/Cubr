/** View models for the Home dashboard (Section 6.4 shelves + 6.5 quick stats). */

export type ShelfKind = "solve" | "algorithm" | "scan" | "guide";

export interface ShelfCardItem {
  id: string;
  title: string;
  /** One line of metadata (Section 6.4: minimal text). */
  subtitle: string;
  kind: ShelfKind;
  /** Destination route. */
  href: string;
}

export interface Shelf {
  id: string;
  heading: string;
  items: ShelfCardItem[];
}
