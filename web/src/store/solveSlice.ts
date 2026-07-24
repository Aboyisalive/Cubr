import { create } from "zustand";
import type { CubeState, Facelets } from "@shared/types/cube_state";
import { SOLVED_FACELETS } from "@shared/types/cube_state";
import type { SolveRecord } from "@shared/types/solve_record";

interface SolveState {
  /** The cube currently being entered / solved / played back. */
  cube: CubeState;
  /** Locally-recorded solves (mirrors server; synced later). */
  history: SolveRecord[];
  setFacelets: (facelets: Facelets) => void;
  resetCube: () => void;
  addSolve: (solve: SolveRecord) => void;
}

export const useSolveStore = create<SolveState>((set) => ({
  cube: { facelets: SOLVED_FACELETS },
  history: [],
  setFacelets: (facelets) => set({ cube: { facelets } }),
  resetCube: () => set({ cube: { facelets: SOLVED_FACELETS } }),
  addSolve: (solve) => set((s) => ({ history: [solve, ...s.history] })),
}));
