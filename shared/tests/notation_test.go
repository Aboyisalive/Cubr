package tests

import (
	"testing"

	cubecore "github.com/Aboyisalive/cubr/shared/cube-core"
)

func TestParseFormatRoundTrip(t *testing.T) {
	cases := []string{
		"R U R' U'",
		"F2 B2 U D' L R'",
		"U",
		"R U R' U R U2 R'",
	}
	for _, s := range cases {
		moves, err := cubecore.ParseMoves(s)
		if err != nil {
			t.Fatalf("ParseMoves(%q): %v", s, err)
		}
		if got := cubecore.FormatMoves(moves); got != s {
			t.Errorf("round trip %q -> %q", s, got)
		}
	}
}

func TestParseRejectsGarbage(t *testing.T) {
	for _, s := range []string{"X", "R3", "R''", "Uw"} {
		if _, err := cubecore.ParseMoves(s); err == nil {
			t.Errorf("ParseMoves(%q) should fail", s)
		}
	}
}

func TestMoveIdentities(t *testing.T) {
	solved := cubecore.SolvedCubie()
	// X applied four times is the identity, for every face.
	for f := 0; f < 6; f++ {
		s := solved
		for i := 0; i < 4; i++ {
			s = s.Apply(cubecore.Move{Face: f, Turns: 1})
		}
		if !s.IsSolved() {
			t.Errorf("face %d: four quarter turns should be identity", f)
		}
	}
	// A sequence followed by its inverse is the identity.
	seq, _ := cubecore.ParseMoves("R U2 F' L D B2 U' R2")
	s := solved.ApplyAll(seq).ApplyAll(cubecore.Inverse(seq))
	if !s.IsSolved() {
		t.Error("sequence * inverse should be identity")
	}
	// The sexy move has order 6.
	sexy, _ := cubecore.ParseMoves("R U R' U'")
	s = solved
	for i := 0; i < 6; i++ {
		s = s.ApplyAll(sexy)
	}
	if !s.IsSolved() {
		t.Error("(R U R' U')^6 should be identity")
	}
}

func TestFaceletCubieRoundTrip(t *testing.T) {
	if got := cubecore.SolvedCubie().ToFacelets(); got != cubecore.SolvedFacelets {
		t.Fatalf("solved facelets mismatch: %s", got)
	}
	seq, _ := cubecore.ParseMoves("R U R' U' F2 D L' B")
	state := cubecore.SolvedCubie().ApplyAll(seq)
	f := state.ToFacelets()
	back, err := cubecore.FaceletsToCubie(f)
	if err != nil {
		t.Fatalf("FaceletsToCubie: %v", err)
	}
	if back != state {
		t.Error("facelet -> cubie round trip lost information")
	}
}

func TestValidate(t *testing.T) {
	if v := cubecore.Validate(cubecore.SolvedFacelets); !v.Valid {
		t.Fatalf("solved state must validate: %+v", v.Errors)
	}
	// A scrambled-but-legal state validates.
	seq, _ := cubecore.ParseMoves("L2 B D' R F U2 R'")
	f := cubecore.SolvedCubie().ApplyAll(seq).ToFacelets()
	if v := cubecore.Validate(f); !v.Valid {
		t.Fatalf("legal scramble must validate: %+v", v.Errors)
	}
	// Wrong length.
	if v := cubecore.Validate("UUU"); v.Valid || v.Errors[0].Code != "BAD_LENGTH" {
		t.Error("short string must fail BAD_LENGTH")
	}
	// Swapping two adjacent edge stickers flips one edge: FLIP parity.
	b := []byte(cubecore.SolvedFacelets)
	b[7], b[19] = b[19], b[7] // UF edge stickers
	v := cubecore.Validate(string(b))
	if v.Valid {
		t.Error("single flipped edge must be invalid")
	}
	// Unbalanced colors.
	b = []byte(cubecore.SolvedFacelets)
	b[0] = 'D'
	if v := cubecore.Validate(string(b)); v.Valid {
		t.Error("unbalanced colors must be invalid")
	}
}
