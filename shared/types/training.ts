/**
 * Core training/session contracts used by the timer, trainer, and guide engine.
 */

import type { TimerPhase } from "./timer_event";

export interface CubeState {
  facelets: string;
  scheme?: Record<string, string>;
}

export interface SolveStep {
  name: string;
  moves: string;
}

export interface SolvePlan {
  method: string;
  steps: SolveStep[];
  moves: string;
}

export interface TimerSession {
  id: string;
  startedAt: number;
  finishedAt?: number;
  phase: TimerPhase;
  inspectionMs?: number;
  elapsedMs: number;
  scramble?: string;
  state?: string;
  method?: string;
}

export interface TrainingCase {
  id: string;
  kind: "OLL" | "PLL" | "F2L" | "CROSS" | "BEGINNER";
  name: string;
  state: string;
  moves?: string;
  notes?: string;
  createdAt: number;
}
