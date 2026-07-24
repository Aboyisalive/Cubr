/**
 * Algorithm contract — the trainable case library (Guide + Pro Mode, Phase 6).
 */

export type AlgSet = "OLL" | "PLL" | "F2L" | "CROSS" | "BEGINNER";

export interface Algorithm {
  id: string;
  set: AlgSet;
  /** Case name, e.g. "T-Perm", "Sune", "Anti-Sune". */
  name: string;
  /** Primary/recommended solution in WCA notation. */
  moves: string;
  /** Alternate solutions for the same case. */
  alternatives?: string[];
  /** Grouping within a set, e.g. OLL number or PLL letter. */
  group?: string;
  /** User has marked this a favorite (Phase 6). */
  favorite?: boolean;
  /** 0–1 recognition/execution confidence from training history. */
  mastery?: number;
}
