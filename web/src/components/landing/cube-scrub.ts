/**
 * Deterministic scrub math for the scroll cube (pure, unit-tested).
 *
 * The solve sequence is applied to solved cubie positions for any scroll
 * progress in [0, 1]: each move rotates its layer by the move's angle
 * scaled by its local slice of progress. Because every frame recomputes
 * from the solved state, scrubbing forwards and backwards is exact — no
 * accumulated drift, no React state in the loop.
 */

export type Vec3 = { x: number; y: number; z: number }
export type Axis = 'x' | 'y' | 'z'
export type MoveDef = { axis: Axis; layer: -1 | 0 | 1; angle: number }

/** A named scramble; the cube on the page starts here and solves. */
export const SCRAMBLE: readonly string[] = [
  'R', "U'", 'F2', 'L', 'D', "B'", "R'", 'U', 'F', 'L2', "D'", 'U2',
]

/**
 * The repetitive algorithm cycled during the four "How it works" step
 * slides: the sexy move (R U R' U') three times, scrubbed on top of the
 * scrambled state. The Why slides then solve scramble + loop combined.
 */
export const STEP_LOOP: readonly string[] = [
  'R', 'U', "R'", "U'",
  'R', 'U', "R'", "U'",
  'R', 'U', "R'", "U'",
]

/** Every move the Why phase must undo, in the order it was applied. */
export const COMBINED_SCRAMBLE: readonly string[] = [...SCRAMBLE, ...STEP_LOOP]

const FACE_MOVES: Record<string, { axis: Axis; layer: -1 | 0 | 1; sign: 1 | -1 }> = {
  R: { axis: 'x', layer: 1, sign: -1 },
  L: { axis: 'x', layer: -1, sign: 1 },
  U: { axis: 'y', layer: 1, sign: -1 },
  D: { axis: 'y', layer: -1, sign: 1 },
  F: { axis: 'z', layer: 1, sign: -1 },
  B: { axis: 'z', layer: -1, sign: 1 },
}

function parseMove(token: string): MoveDef {
  const face = FACE_MOVES[token[0]]
  if (!face) throw new Error(`unknown move ${token}`)
  const suffix = token.slice(1)
  const quarter = suffix === '2' ? 2 : 1
  const direction = suffix === "'" ? -1 : 1
  return {
    axis: face.axis,
    layer: face.layer,
    angle: face.sign * direction * quarter * (Math.PI / 2),
  }
}

function invertMove(move: MoveDef): MoveDef {
  return { ...move, angle: -move.angle }
}

/** Moves that solve the combined state (exact reverse: loop first, then scramble). */
export const SOLVE_MOVES: readonly MoveDef[] = [...COMBINED_SCRAMBLE]
  .reverse()
  .map((token) => invertMove(parseMove(token)))

/** Notation labels for the six Why slides (four solve moves each). */
export const SOLVE_NOTATION: readonly string[] = (() => {
  const solveTokens = [...COMBINED_SCRAMBLE].reverse().map((token) => {
    if (token.endsWith('2')) return token
    return token.endsWith("'") ? token.slice(0, -1) : `${token}'`
  })
  const groups: string[] = []
  for (let i = 0; i < solveTokens.length; i += 4) {
    groups.push(solveTokens.slice(i, i + 4).join(' '))
  }
  return groups
})()

/** Share of the journey scroll spent in the steps loop (4 of 10 slides). */
export const STEPS_SHARE = 0.4

export function solvedPositions(): Vec3[] {
  const positions: Vec3[] = []
  for (const x of [-1, 0, 1])
    for (const y of [-1, 0, 1])
      for (const z of [-1, 0, 1]) {
        if (x === 0 && y === 0 && z === 0) continue // 26 cubies, no core
        positions.push({ x, y, z })
      }
  return positions
}

function rotate(pos: Vec3, axis: Axis, angle: number): Vec3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  switch (axis) {
    case 'x':
      return { x: pos.x, y: pos.y * c - pos.z * s, z: pos.y * s + pos.z * c }
    case 'y':
      return { x: pos.x * c + pos.z * s, y: pos.y, z: -pos.x * s + pos.z * c }
    case 'z':
      return { x: pos.x * c - pos.y * s, y: pos.x * s + pos.y * c, z: pos.z }
  }
}

export type CubieTransform = {
  position: Vec3
  /** Rotation to apply to the cubie mesh, in order, as (axis, angle). */
  rotations: readonly { axis: Axis; angle: number }[]
}

function applyMove(
  states: { position: Vec3; rotations: { axis: Axis; angle: number }[] }[],
  move: MoveDef,
  fraction: number,
) {
  for (const state of states) {
    if (Math.round(state.position[move.axis]) === move.layer) {
      const angle = move.angle * fraction
      state.position = rotate(state.position, move.axis, angle)
      state.rotations.push({ axis: move.axis, angle })
    }
  }
}

function applySequence(
  states: { position: Vec3; rotations: { axis: Axis; angle: number }[] }[],
  moves: readonly MoveDef[],
  progress: number,
) {
  for (let i = 0; i < moves.length; i++) {
    const local = Math.min(1, Math.max(0, progress * moves.length - i))
    if (local <= 0) break
    applyMove(states, moves[i], local)
  }
}

/**
 * Transforms for every cubie at journey scroll `progress`:
 * - 0 = scrambled cube (the page starts here),
 * - [0, STEPS_SHARE] = the repetitive step-loop algorithm scrubbing on
 *   top of the scrambled state,
 * - [STEPS_SHARE, 1] = the combined scramble + loop being solved,
 * - 1 = solved.
 */
export function cubieTransformsAt(progress: number): CubieTransform[] {
  const clamped = Math.min(1, Math.max(0, progress))
  const states = solvedPositions().map((position) => ({
    position: { ...position },
    rotations: [] as { axis: Axis; angle: number }[],
  }))

  // Start scrambled (instant, full sequence).
  for (const move of SCRAMBLE.map(parseMove)) applyMove(states, move, 1)

  const stepsProgress = Math.min(1, clamped / STEPS_SHARE)
  applySequence(states, STEP_LOOP.map(parseMove), stepsProgress)

  const whyProgress = Math.min(1, Math.max(0, (clamped - STEPS_SHARE) / (1 - STEPS_SHARE)))
  applySequence(states, SOLVE_MOVES, whyProgress)

  return states
}
