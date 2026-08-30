/**
 * Central registry of backend endpoints. Paths mirror the Phase 2 solver service
 * and Phase 3 resource routes; the OpenAPI/proto contracts in shared/contracts are
 * the source of truth. Keeping them here means screens never hard-code URLs.
 */
export const ENDPOINTS = {
  // Phase 2 — solver service
  solverValidate: "/api/solver/validate",
  solverSolve: "/api/solver/solve",
  scramble: "/api/solver/scramble",

  // Phase 3 — solves, stats
  solves: "/api/solves",
  stats: "/api/stats",

  // Guide / Pro Mode — algorithm library
  algorithms: "/api/algorithms",

  // Home dashboard shelves
  shelves: "/api/home/shelves",

  // Auth
  login: "/api/auth/login",
  session: "/api/auth/session",
  waitlistJoin: "/api/waitlist",
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;
