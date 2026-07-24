package tests

import (
	"math/rand"
	"testing"

	cubecore "github.com/Aboyisalive/cubr/shared/cube-core"
)

func TestScrambleShape(t *testing.T) {
	rng := rand.New(rand.NewSource(42))
	for trial := 0; trial < 100; trial++ {
		s := cubecore.GenerateScramble(25, rng)
		if len(s) != 25 {
			t.Fatalf("scramble length %d, want 25", len(s))
		}
		for i, m := range s {
			if m.Turns < 1 || m.Turns > 3 {
				t.Fatalf("move %d has turns %d", i, m.Turns)
			}
			if i > 0 && m.Face == s[i-1].Face {
				t.Fatalf("consecutive same-face moves at %d", i)
			}
		}
		// Every scrambled state must be a valid cube.
		f := cubecore.ScrambledState(s).ToFacelets()
		if v := cubecore.Validate(f); !v.Valid {
			t.Fatalf("scrambled state invalid: %+v", v.Errors)
		}
	}
}

func TestScrambleUndo(t *testing.T) {
	rng := rand.New(rand.NewSource(7))
	s := cubecore.GenerateScramble(25, rng)
	state := cubecore.ScrambledState(s).ApplyAll(cubecore.Inverse(s))
	if !state.IsSolved() {
		t.Error("scramble followed by its inverse should be solved")
	}
}
