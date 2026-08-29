/**
 * In-memory mock adapter. Serves realistic contract-shaped data so the frontend
 * runs standalone before the backend exists. Replaced transparently by real HTTP
 * once VITE_USE_MOCK=false — nothing downstream of `api.get/post` needs to change.
 */
import type { ProfileStats, SolveRecord } from "@shared/types/solve_record";
import type { Algorithm } from "@shared/types/algorithm";
import type { ValidationResult } from "@shared/types/cube_state";
import { SOLVED_FACELETS } from "@shared/types/cube_state";
import type { Shelf } from "@/types/home";
import type { WaitlistSignupResponse } from "@shared/types/waitlist";
import { ENDPOINTS } from "./endpoints";

const NETWORK_DELAY_MS = 320;
let mockWaitlistPosition = 0;

const stats: ProfileStats = {
  totalSolves: 1284,
  bestTimeMs: 8_420,
  streakDays: 17,
  algorithmsLearned: 63,
  ao5: { n: 5, averageMs: 13_910 },
  ao12: { n: 12, averageMs: 15_240 },
};

const recentSolves: SolveRecord[] = [
  {
    id: "s_1041",
    createdAt: "2026-07-22T09:14:00Z",
    scramble: "R U R' U' F2 L D' B2 R2 F' U",
    timeMs: 12_530,
    method: "CFOP",
    penalty: "none",
    moveCount: 58,
    tps: 4.6,
  },
  {
    id: "s_1040",
    createdAt: "2026-07-22T09:11:00Z",
    scramble: "B2 D' R U2 L' F R2 U B' D2 F2",
    timeMs: 8_420,
    method: "CFOP",
    penalty: "none",
    moveCount: 51,
    tps: 6.1,
  },
];

const algorithms: Algorithm[] = [
  { id: "pll_t", set: "PLL", name: "T-Perm", moves: "R U R' U' R' F R2 U' R' U' R U R' F'", group: "T", favorite: true, mastery: 0.9 },
  { id: "oll_sune", set: "OLL", name: "Sune", moves: "R U R' U R U2 R'", group: "27", mastery: 0.8 },
  { id: "oll_antisune", set: "OLL", name: "Anti-Sune", moves: "R U2 R' U' R U' R'", group: "26", mastery: 0.55 },
  { id: "pll_y", set: "PLL", name: "Y-Perm", moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'", group: "Y", mastery: 0.4 },
];

const shelves: Shelf[] = [
  {
    id: "continue",
    heading: "Continue Solving",
    items: [
      { id: "c1", title: "CFOP session", subtitle: "F2L · paused at 00:42", kind: "solve", href: "/app/solver" },
      { id: "c2", title: "One-handed Ao12", subtitle: "3 of 12 solves", kind: "solve", href: "/app/solver" },
      { id: "c3", title: "Roux practice", subtitle: "First block drills", kind: "solve", href: "/app/solver" },
    ],
  },
  {
    id: "suggested",
    heading: "Suggested Algorithms",
    items: [
      { id: "a1", title: "Y-Perm", subtitle: "PLL · needs review", kind: "algorithm", href: "/app/guide" },
      { id: "a2", title: "Anti-Sune", subtitle: "OLL · 55% mastery", kind: "algorithm", href: "/app/guide" },
      { id: "a3", title: "J-Perm (a)", subtitle: "PLL · not started", kind: "algorithm", href: "/app/guide" },
      { id: "a4", title: "Winter Variation", subtitle: "F2L · advanced", kind: "algorithm", href: "/app/guide" },
    ],
  },
  {
    id: "recent-scans",
    heading: "Recent Scans",
    items: [
      { id: "r1", title: "Scan · 09:14", subtitle: "Solved in 58 moves", kind: "scan", href: "/app/solver" },
      { id: "r2", title: "Scan · 08:57", subtitle: "Validated OK", kind: "scan", href: "/app/solver" },
      { id: "r3", title: "Scan · yesterday", subtitle: "Corrected 2 stickers", kind: "scan", href: "/app/solver" },
    ],
  },
];

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));
}

export function mockResolve<T>(method: string, path: string, _body?: unknown): Promise<T> {
  const route = `${method} ${path}`;

  if (route === `POST ${ENDPOINTS.login}` || route === "POST /api/auth/register") {
    const email = (_body as { email?: string } | undefined)?.email ?? "demo@cubr.app";
    return delay({
      id: "u_demo",
      email,
      displayName: email.split("@")[0] ?? "cuber",
    } as unknown as T);
  }
  if (route === "POST /api/auth/logout") {
    return delay({ ok: true } as unknown as T);
  }
  if (route === `POST ${ENDPOINTS.waitlistJoin}`) {
    return delay({
      id: `w_mock_${++mockWaitlistPosition}`,
      position: mockWaitlistPosition,
    } as WaitlistSignupResponse as unknown as T);
  }

  switch (route) {
    case `GET ${ENDPOINTS.stats}`:
      return delay(stats as unknown as T);
    case `GET ${ENDPOINTS.shelves}`:
      return delay(shelves as unknown as T);
    case `GET ${ENDPOINTS.solves}`:
      return delay(recentSolves as unknown as T);
    case `GET ${ENDPOINTS.algorithms}`:
      return delay(algorithms as unknown as T);
    case `POST ${ENDPOINTS.solverValidate}`:
      return delay({ valid: true, errors: [] } as ValidationResult as unknown as T);
    case `POST ${ENDPOINTS.solverSolve}`:
      return delay({ solution: "R U R' U'", moveCount: 4, state: SOLVED_FACELETS } as unknown as T);
    default:
      return Promise.reject(new Error(`No mock for ${route}`));
  }
}
