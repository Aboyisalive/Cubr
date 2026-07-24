// Package cubecore is the Phase 1 cube engine: cube state, moves, notation,
// validation, scrambling, and the beginner solve planner (Phase 2).
//
// A cube state is exposed as a 54-character facelet string in URFDLB face order
// (each face 9 stickers, row-major top-left → bottom-right), matching the
// TypeScript contract in shared/types/cube_state.ts. Internally the engine works
// on a cubie-level model (corner/edge permutation + orientation), which is what
// makes validation (parity laws) and solving tractable.
package cubecore

import "fmt"

// SolvedFacelets is the identity state, mirroring SOLVED_FACELETS in the TS contract.
const SolvedFacelets = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"

// Corner slot/piece indices.
const (
	URF = iota
	UFL
	ULB
	UBR
	DFR
	DLF
	DBL
	DRB
)

// Edge slot/piece indices.
const (
	UR = iota
	UF
	UL
	UB
	DR
	DF
	DL
	DB
	FR
	FL
	BL
	BR
)

// CubieCube is the cubie-level state: Cp[slot] = corner piece occupying slot,
// Co[slot] = its twist (0..2), Ep/Eo likewise for edges (flip 0..1).
type CubieCube struct {
	Cp [8]int
	Co [8]int
	Ep [12]int
	Eo [12]int
}

// SolvedCubie returns the identity cubie state.
func SolvedCubie() CubieCube {
	var c CubieCube
	for i := 0; i < 8; i++ {
		c.Cp[i] = i
	}
	for i := 0; i < 12; i++ {
		c.Ep[i] = i
	}
	return c
}

// IsSolved reports whether the state is the identity.
func (c CubieCube) IsSolved() bool {
	return c == SolvedCubie()
}

// cornerFacelet[slot] lists the 3 facelet indices of a corner slot, starting
// with the U/D-axis sticker. cornerColor[piece] lists the piece's colors in the
// same order. (Standard Kociemba mapping.)
var cornerFacelet = [8][3]int{
	{8, 9, 20},   // URF
	{6, 18, 38},  // UFL
	{0, 36, 47},  // ULB
	{2, 45, 11},  // UBR
	{29, 26, 15}, // DFR
	{27, 44, 24}, // DLF
	{33, 53, 42}, // DBL
	{35, 17, 51}, // DRB
}

var cornerColor = [8][3]byte{
	{'U', 'R', 'F'},
	{'U', 'F', 'L'},
	{'U', 'L', 'B'},
	{'U', 'B', 'R'},
	{'D', 'F', 'R'},
	{'D', 'L', 'F'},
	{'D', 'B', 'L'},
	{'D', 'R', 'B'},
}

var edgeFacelet = [12][2]int{
	{5, 10},  // UR
	{7, 19},  // UF
	{3, 37},  // UL
	{1, 46},  // UB
	{32, 16}, // DR
	{28, 25}, // DF
	{30, 43}, // DL
	{34, 52}, // DB
	{23, 12}, // FR
	{21, 41}, // FL
	{50, 39}, // BL
	{48, 14}, // BR
}

var edgeColor = [12][2]byte{
	{'U', 'R'},
	{'U', 'F'},
	{'U', 'L'},
	{'U', 'B'},
	{'D', 'R'},
	{'D', 'F'},
	{'D', 'L'},
	{'D', 'B'},
	{'F', 'R'},
	{'F', 'L'},
	{'B', 'L'},
	{'B', 'R'},
}

// centerIdx[i] is the facelet index of face i's center, in URFDLB order.
var centerIdx = [6]int{4, 13, 22, 31, 40, 49}

var faceLetters = [6]byte{'U', 'R', 'F', 'D', 'L', 'B'}

// ValidationError mirrors the TS contract's {code, message, facelets?}.
type ValidationError struct {
	Code     string `json:"code"`
	Message  string `json:"message"`
	Facelets []int  `json:"facelets,omitempty"`
}

// ValidationResult mirrors the TS contract's {valid, errors}.
type ValidationResult struct {
	Valid  bool              `json:"valid"`
	Errors []ValidationError `json:"errors"`
}

// Validate checks a facelet string for structural and physical solvability:
// length/charset, centers, color counts, identifiable pieces, and the three
// parity laws (twist, flip, permutation).
func Validate(facelets string) ValidationResult {
	var errs []ValidationError
	fail := func(code, msg string, idx ...int) {
		errs = append(errs, ValidationError{Code: code, Message: msg, Facelets: idx})
	}

	if len(facelets) != 54 {
		fail("BAD_LENGTH", fmt.Sprintf("facelet string must be 54 characters, got %d", len(facelets)))
		return ValidationResult{Valid: false, Errors: errs}
	}
	counts := map[byte]int{}
	for i := 0; i < 54; i++ {
		c := facelets[i]
		switch c {
		case 'U', 'R', 'F', 'D', 'L', 'B':
			counts[c]++
		default:
			fail("BAD_CHARS", fmt.Sprintf("invalid facelet letter %q at index %d", c, i), i)
		}
	}
	if len(errs) > 0 {
		return ValidationResult{Valid: false, Errors: errs}
	}
	for _, f := range faceLetters {
		if counts[f] != 9 {
			fail("COLOR_COUNT", fmt.Sprintf("expected 9 %q stickers, got %d", f, counts[f]))
		}
	}
	for i, f := range faceLetters {
		if facelets[centerIdx[i]] != f {
			fail("BAD_CENTERS", fmt.Sprintf("center of face %d must be %q (URFDLB order)", i, f), centerIdx[i])
		}
	}
	if len(errs) > 0 {
		return ValidationResult{Valid: false, Errors: errs}
	}

	cc, err := FaceletsToCubie(facelets)
	if err != nil {
		fail("BAD_PIECE", err.Error())
		return ValidationResult{Valid: false, Errors: errs}
	}

	twist := 0
	for _, o := range cc.Co {
		twist += o
	}
	if twist%3 != 0 {
		fail("TWIST", "corner twist parity violated (a single corner is rotated)")
	}
	flip := 0
	for _, o := range cc.Eo {
		flip += o
	}
	if flip%2 != 0 {
		fail("FLIP", "edge flip parity violated (a single edge is flipped)")
	}
	if permParity(cc.Cp[:]) != permParity(cc.Ep[:]) {
		fail("PARITY", "permutation parity violated (two pieces are swapped)")
	}
	return ValidationResult{Valid: len(errs) == 0, Errors: errs}
}

func permParity(p []int) int {
	parity := 0
	for i := 0; i < len(p); i++ {
		for j := i + 1; j < len(p); j++ {
			if p[i] > p[j] {
				parity ^= 1
			}
		}
	}
	return parity
}

// FaceletsToCubie converts a facelet string to the cubie model, erroring on any
// unidentifiable piece (e.g. two stickers of one color on the same cubie).
func FaceletsToCubie(f string) (CubieCube, error) {
	var c CubieCube
	if len(f) != 54 {
		return c, fmt.Errorf("facelet string must be 54 characters, got %d", len(f))
	}
	for slot := 0; slot < 8; slot++ {
		ori := -1
		for o := 0; o < 3; o++ {
			ch := f[cornerFacelet[slot][o]]
			if ch == 'U' || ch == 'D' {
				ori = o
				break
			}
		}
		if ori < 0 {
			return c, fmt.Errorf("corner slot %d has no U/D sticker", slot)
		}
		c1 := f[cornerFacelet[slot][(ori+1)%3]]
		c2 := f[cornerFacelet[slot][(ori+2)%3]]
		piece := -1
		for p := 0; p < 8; p++ {
			if f[cornerFacelet[slot][ori]] == cornerColor[p][0] &&
				c1 == cornerColor[p][1] && c2 == cornerColor[p][2] {
				piece = p
				break
			}
		}
		if piece < 0 {
			return c, fmt.Errorf("corner slot %d holds an impossible piece", slot)
		}
		c.Cp[slot] = piece
		c.Co[slot] = ori
	}
	for slot := 0; slot < 12; slot++ {
		piece, ori := -1, -1
		for p := 0; p < 12; p++ {
			a, b := f[edgeFacelet[slot][0]], f[edgeFacelet[slot][1]]
			if a == edgeColor[p][0] && b == edgeColor[p][1] {
				piece, ori = p, 0
				break
			}
			if a == edgeColor[p][1] && b == edgeColor[p][0] {
				piece, ori = p, 1
				break
			}
		}
		if piece < 0 {
			return c, fmt.Errorf("edge slot %d holds an impossible piece", slot)
		}
		c.Ep[slot] = piece
		c.Eo[slot] = ori
	}
	// Reject duplicate pieces (each piece must appear exactly once).
	var seenC, seenE [12]bool
	for _, p := range c.Cp {
		if seenC[p] {
			return c, fmt.Errorf("corner piece %d appears twice", p)
		}
		seenC[p] = true
	}
	for _, p := range c.Ep {
		if seenE[p] {
			return c, fmt.Errorf("edge piece %d appears twice", p)
		}
		seenE[p] = true
	}
	return c, nil
}

// ToFacelets renders the cubie state back to a 54-character facelet string.
func (c CubieCube) ToFacelets() string {
	f := make([]byte, 54)
	for i, idx := range centerIdx {
		f[idx] = faceLetters[i]
	}
	for slot := 0; slot < 8; slot++ {
		piece, ori := c.Cp[slot], c.Co[slot]
		for k := 0; k < 3; k++ {
			f[cornerFacelet[slot][(k+ori)%3]] = cornerColor[piece][k]
		}
	}
	for slot := 0; slot < 12; slot++ {
		piece, ori := c.Ep[slot], c.Eo[slot]
		for k := 0; k < 2; k++ {
			f[edgeFacelet[slot][(k+ori)%2]] = edgeColor[piece][k]
		}
	}
	return string(f)
}
