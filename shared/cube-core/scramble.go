package cubecore

import "math/rand"

// ScrambleLength is the default random-move scramble length (WCA 3x3 uses
// random-state scrambles; random-move is standard for an MVP and always valid).
const ScrambleLength = 25

var axisOf = [6]int{0, 1, 2, 0, 1, 2} // U/D, R/L, F/B share an axis

// GenerateScramble produces a random scramble of n moves, never repeating a face
// consecutively and never emitting three same-axis moves in a row (e.g. U D U).
func GenerateScramble(n int, rng *rand.Rand) []Move {
	if n <= 0 {
		n = ScrambleLength
	}
	out := make([]Move, 0, n)
	prev, prev2 := -1, -1
	for len(out) < n {
		f := rng.Intn(6)
		if f == prev {
			continue
		}
		if prev >= 0 && prev2 >= 0 && axisOf[f] == axisOf[prev] && f == prev2 {
			continue
		}
		out = append(out, Move{Face: f, Turns: 1 + rng.Intn(3)})
		prev2, prev = prev, f
	}
	return out
}

// ScrambledState applies a scramble to the solved cube and returns the state.
func ScrambledState(moves []Move) CubieCube {
	return SolvedCubie().ApplyAll(moves)
}
