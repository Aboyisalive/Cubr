package tests

import (
	"math/rand"
	"testing"

	cubecore "github.com/Aboyisalive/cubr/shared/cube-core"
)

func TestSolveSolvedCube(t *testing.T) {
	res, err := cubecore.Solve(cubecore.SolvedFacelets)
	if err != nil {
		t.Fatalf("Solve(solved): %v", err)
	}
	if res.MoveCount() != 0 {
		t.Errorf("solved cube should need 0 moves, got %d (%s)", res.MoveCount(), res.Solution())
	}
}

func TestSolveKnownScrambles(t *testing.T) {
	for _, scr := range []string{
		"R U R' U'",
		"F2 D2 L2",
		"R U2 F' L D B2 U' R2 D' F",
		"B2 D' R U2 L' F R2 U B' D2 F2",
	} {
		assertSolvable(t, scr)
	}
}

func TestSolveRandomScrambles(t *testing.T) {
	rng := rand.New(rand.NewSource(2026))
	for trial := 0; trial < 50; trial++ {
		s := cubecore.GenerateScramble(25, rng)
		assertSolvable(t, cubecore.FormatMoves(s))
	}
}

func assertSolvable(t *testing.T, scramble string) {
	t.Helper()
	moves, err := cubecore.ParseMoves(scramble)
	if err != nil {
		t.Fatalf("parse %q: %v", scramble, err)
	}
	start := cubecore.SolvedCubie().ApplyAll(moves)
	res, err := cubecore.Solve(start.ToFacelets())
	if err != nil {
		t.Fatalf("Solve(%q): %v", scramble, err)
	}
	if !start.ApplyAll(res.Moves).IsSolved() {
		t.Fatalf("solution for %q does not solve the cube: %s", scramble, res.Solution())
	}
	if res.MoveCount() > 250 {
		t.Errorf("solution for %q unreasonably long: %d moves", scramble, res.MoveCount())
	}
	if len(res.Stages) != 7 {
		t.Errorf("expected 7 stages, got %d", len(res.Stages))
	}
}
