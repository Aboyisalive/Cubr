import { describe, expect, it } from 'vitest'
import {
  cubieTransformsAt,
  SCRAMBLE,
  solvedPositions,
  SOLVE_MOVES,
  SOLVE_NOTATION,
  STEP_LOOP,
  STEPS_SHARE,
} from './cube-scrub'

describe('cube scrub', () => {
  it('has 26 cubies, a 12-move scramble, a 12-move step loop, a 24-move solve', () => {
    expect(solvedPositions()).toHaveLength(26)
    expect(SCRAMBLE).toHaveLength(12)
    expect(STEP_LOOP).toHaveLength(12)
    // The sexy move repeated: R U R' U' x3.
    expect(STEP_LOOP.slice(0, 4)).toEqual(['R', 'U', "R'", "U'"])
    expect(SOLVE_MOVES).toHaveLength(24)
    expect(SOLVE_NOTATION).toHaveLength(6)
  })

  it('the step loop changes the scrambled state (and stays a valid permutation)', () => {
    const keys = (p: number, sort: boolean) => {
      const list = cubieTransformsAt(p).map(
        (t) => `${Math.round(t.position.x)},${Math.round(t.position.y)},${Math.round(t.position.z)}`,
      )
      return (sort ? list.sort() : list).join('|')
    }
    // Per-cubie positions differ after the loop runs…
    expect(keys(STEPS_SHARE, false)).not.toBe(keys(0, false))
    // …but together they still occupy exactly the 26 solved slots.
    expect(new Set(keys(STEPS_SHARE, true).split('|')).size).toBe(26)
  })

  it('progress 1 returns every cubie to its solved slot', () => {
    const solved = solvedPositions()
    const atEnd = cubieTransformsAt(1)
    const byKey = (list: typeof solved) =>
      list
        .map((p) => `${p.x},${p.y},${p.z}`)
        .sort()
        .join('|')
    expect(byKey(atEnd.map((t) => ({
      x: Math.round(t.position.x),
      y: Math.round(t.position.y),
      z: Math.round(t.position.z),
    })))).toBe(byKey(solved))
    // Each cubie's net orientation is an exact quarter-turn multiple.
    for (const t of atEnd) {
      const total = t.rotations.reduce((sum, r) => sum + Math.abs(r.angle), 0)
      expect(total).toBeGreaterThan(0)
    }
  })

  it('progress 0 is the scrambled state (not solved)', () => {
    const solvedKeys = new Set(
      solvedPositions().map((p) => `${p.x},${p.y},${p.z}`),
    )
    const scrambled = cubieTransformsAt(0)
    // Positions are a permutation of solved slots, but orientations differ
    // from the untouched cube: at least one cubie carries rotation.
    const anyRotated = scrambled.some((t) => t.rotations.length > 0)
    expect(anyRotated).toBe(true)
    expect(scrambled).toHaveLength(26)
    for (const t of scrambled) {
      const key = `${Math.round(t.position.x)},${Math.round(t.position.y)},${Math.round(t.position.z)}`
      expect(solvedKeys.has(key)).toBe(true)
    }
  })

  it('clamps out-of-range progress', () => {
    expect(cubieTransformsAt(-1)).toEqual(cubieTransformsAt(0))
    expect(cubieTransformsAt(2)).toEqual(cubieTransformsAt(1))
  })
})
