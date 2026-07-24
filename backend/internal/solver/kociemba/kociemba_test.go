package kociemba

import (
	"math/rand"
	"testing"
	"time"

	cubecore "github.com/Aboyisalive/cubr/shared/cube-core"
)

func TestCoordinateRoundTrips(t *testing.T) {
	initChoose()
	for i := 0; i < nTwist; i += 97 {
		c := cubecore.SolvedCubie()
		setTwist(&c, i)
		if got := getTwist(&c); got != i {
			t.Fatalf("twist round-trip: set %d, got %d", i, got)
		}
	}
	for i := 0; i < nFlip; i += 53 {
		c := cubecore.SolvedCubie()
		setFlip(&c, i)
		if got := getFlip(&c); got != i {
			t.Fatalf("flip round-trip: set %d, got %d", i, got)
		}
	}
	for i := 0; i < nSlice; i++ {
		c := cubecore.SolvedCubie()
		setSlice(&c, i)
		if got := getSlice(&c); got != i {
			t.Fatalf("slice round-trip: set %d, got %d", i, got)
		}
	}
	for i := 0; i < nCPerm; i += 1013 {
		p := unrankPermSimple(8, i)
		if got := rankPerm(p); got != i {
			t.Fatalf("perm round-trip: set %d, got %d (perm %v)", i, got, p)
		}
	}
}

func TestSolveIdentity(t *testing.T) {
	sol, err := Solve(cubecore.SolvedCubie(), nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(sol) != 0 {
		t.Fatalf("solved cube should need 0 moves, got %v", cubecore.FormatMoves(sol))
	}
}

func TestSolveSingleMoves(t *testing.T) {
	for _, m := range cubecore.AllMoves() {
		cc := cubecore.SolvedCubie().Apply(m)
		sol, err := Solve(cc, nil)
		if err != nil {
			t.Fatal(err)
		}
		if got := cc.ApplyAll(sol); !got.IsSolved() {
			t.Fatalf("solution %q does not solve single-move state %v",
				cubecore.FormatMoves(sol), m)
		}
		if len(sol) != 1 {
			t.Errorf("single-move state solved in %d moves (%s), want 1",
				len(sol), cubecore.FormatMoves(sol))
		}
	}
}

func TestSolveRandomScrambles(t *testing.T) {
	rng := rand.New(rand.NewSource(42))
	total := 0
	for i := 0; i < 20; i++ {
		scramble := cubecore.GenerateScramble(25, rng)
		cc := cubecore.ScrambledState(scramble)
		start := time.Now()
		sol, err := Solve(cc, nil)
		if err != nil {
			t.Fatalf("scramble %q: %v", cubecore.FormatMoves(scramble), err)
		}
		if got := cc.ApplyAll(sol); !got.IsSolved() {
			t.Fatalf("scramble %q: solution %q leaves cube unsolved",
				cubecore.FormatMoves(scramble), cubecore.FormatMoves(sol))
		}
		if len(sol) > 24 {
			t.Errorf("scramble %q: solution length %d exceeds 24", cubecore.FormatMoves(scramble), len(sol))
		}
		total += len(sol)
		t.Logf("solve %d: %d moves in %s", i, len(sol), time.Since(start).Round(time.Millisecond))
	}
	t.Logf("mean length %.1f", float64(total)/20)
}

func TestSolveFaceletsRejectsInvalid(t *testing.T) {
	if _, err := SolveFacelets("UUU", nil); err == nil {
		t.Fatal("want error for malformed facelets")
	}
	// Single twisted corner: unsolvable.
	cc := cubecore.SolvedCubie()
	cc.Co[0] = 1
	if _, err := SolveFacelets(cc.ToFacelets(), nil); err == nil {
		t.Fatal("want error for twisted-corner state")
	}
}
