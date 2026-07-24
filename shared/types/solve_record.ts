/**
 * Solve record + stats contracts (Phase 3 basic stats → Phase 6 pro analytics).
 */
import type { Facelets } from "./cube_state";
import type { InspectionPenalty } from "./timer_event";

export type SolveMethod = "CFOP" | "Roux" | "ZZ" | "Beginner";

export interface SolveRecord {
  id: string;
  /** ISO-8601 creation time. */
  createdAt: string;
  /** Scramble in standard WCA notation, space-separated. */
  scramble: string;
  /** Starting state produced by the scramble. */
  state?: Facelets;
  /** Final solve time in ms (excludes inspection). */
  timeMs: number;
  method: SolveMethod;
  penalty: InspectionPenalty;
  /** Move count of the user's solution, if reconstructed. */
  moveCount?: number;
  /** Turns per second, derived. */
  tps?: number;
}

/** A rolling average over the last N solves (Ao5/Ao12/Ao100, Phase 6). */
export interface AverageOf {
  n: 5 | 12 | 100;
  /** Trimmed-mean average in ms, or null if a DNF makes it invalid. */
  averageMs: number | null;
}

/** Glanceable dashboard numbers for the quick-stats row (Section 6.5). */
export interface ProfileStats {
  totalSolves: number;
  /** Personal-best single, ms. */
  bestTimeMs: number | null;
  /** Current daily solve streak. */
  streakDays: number;
  algorithmsLearned: number;
  /** Optional current averages surfaced on the dashboard. */
  ao5?: AverageOf;
  ao12?: AverageOf;
}
