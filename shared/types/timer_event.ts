/**
 * Timer contract (Phase 3). Models a WCA-style solve timer with optional
 * inspection, emitted as discrete phase transitions the UI subscribes to.
 */

export type TimerPhase =
  | "idle" // nothing running
  | "inspection" // WCA 15s inspection counting down
  | "ready" // holding, armed to start
  | "running" // solve in progress
  | "stopped"; // solve finished, awaiting save/discard

export interface TimerEvent {
  phase: TimerPhase;
  /** Elapsed solve time in ms (0 during inspection). */
  elapsedMs: number;
  /** Remaining inspection time in ms, when phase === "inspection". */
  inspectionMs?: number;
  /** High-resolution timestamp of the event (performance.now()). */
  at: number;
}

/** WCA inspection penalties derived from inspection overrun (Phase 6). */
export type InspectionPenalty = "none" | "plus2" | "dnf";
