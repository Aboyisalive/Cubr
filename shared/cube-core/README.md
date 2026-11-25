# shared/cube-core/ — canonical cube logic (Go)

The single source of truth for cube behavior. Two representations:

- a 54-sticker facelet string (scanner and UI side), and
- a cubie model (corner/edge permutation and orientation) for solving.

Provides move application (all 18 face turns), state validation (color counts,
permutation parity, orientation sums — typed errors), scramble generation,
and solvers returning structured `SolveStep`s, not raw move strings.

Golden test vectors are generated here (`just golden`, F1.4) and consumed by
the Kotlin (F1.5) and TypeScript (F1.6) mirror engines; CI fails if any
implementation drifts.

First fragment: **F1.1** (facelet/cubie types + conversion). Nothing here
yet — F0.1 is scaffold only.
