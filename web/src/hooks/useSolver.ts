import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import type { CubeState, ValidationResult } from "@shared/types/cube_state";

export interface SolveResponse {
  /** Solution in WCA notation. */
  solution: string;
  moveCount: number;
}

/**
 * Solver access (Phase 2 service). Wraps validate + solve as mutations so screens
 * get loading/error state for free. Served by the mock adapter until the Go
 * Kociemba service is live.
 */
export function useSolver() {
  const validate = useMutation({
    mutationFn: (cube: CubeState) =>
      api.post<ValidationResult>(ENDPOINTS.solverValidate, cube),
  });

  const solve = useMutation({
    mutationFn: (cube: CubeState) => api.post<SolveResponse>(ENDPOINTS.solverSolve, cube),
  });

  return { validate, solve };
}
