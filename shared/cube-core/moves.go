package cubecore

// Face indices in URFDLB order.
const (
	FaceU = iota
	FaceR
	FaceF
	FaceD
	FaceL
	FaceB
)

// Move is a face turn: Face 0..5 (URFDLB) and Turns 1..3 quarter-turns clockwise
// (1 = X, 2 = X2, 3 = X').
type Move struct {
	Face  int
	Turns int
}

// The six base quarter-turn moves as cubie permutations (standard Kociemba
// tables). Applying a move M to state S is the group product S * M.
var baseMoves = [6]CubieCube{
	// U
	{
		Cp: [8]int{UBR, URF, UFL, ULB, DFR, DLF, DBL, DRB},
		Co: [8]int{},
		Ep: [12]int{UB, UR, UF, UL, DR, DF, DL, DB, FR, FL, BL, BR},
		Eo: [12]int{},
	},
	// R
	{
		Cp: [8]int{DFR, UFL, ULB, URF, DRB, DLF, DBL, UBR},
		Co: [8]int{2, 0, 0, 1, 1, 0, 0, 2},
		Ep: [12]int{FR, UF, UL, UB, BR, DF, DL, DB, DR, FL, BL, UR},
		Eo: [12]int{},
	},
	// F
	{
		Cp: [8]int{UFL, DLF, ULB, UBR, URF, DFR, DBL, DRB},
		Co: [8]int{1, 2, 0, 0, 2, 1, 0, 0},
		Ep: [12]int{UR, FL, UL, UB, DR, FR, DL, DB, UF, DF, BL, BR},
		Eo: [12]int{0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0},
	},
	// D
	{
		Cp: [8]int{URF, UFL, ULB, UBR, DLF, DBL, DRB, DFR},
		Co: [8]int{},
		Ep: [12]int{UR, UF, UL, UB, DF, DL, DB, DR, FR, FL, BL, BR},
		Eo: [12]int{},
	},
	// L
	{
		Cp: [8]int{URF, ULB, DBL, UBR, DFR, UFL, DLF, DRB},
		Co: [8]int{0, 1, 2, 0, 0, 2, 1, 0},
		Ep: [12]int{UR, UF, BL, UB, DR, DF, FL, DB, FR, UL, DL, BR},
		Eo: [12]int{},
	},
	// B
	{
		Cp: [8]int{URF, UFL, UBR, DRB, DFR, DLF, ULB, DBL},
		Co: [8]int{0, 0, 1, 2, 0, 0, 2, 1},
		Ep: [12]int{UR, UF, UL, BR, DR, DF, DL, BL, FR, FL, UB, DB},
		Eo: [12]int{0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1},
	},
}

// Multiply returns the group product a*b (apply a, then b).
func Multiply(a, b CubieCube) CubieCube {
	var r CubieCube
	for i := 0; i < 8; i++ {
		r.Cp[i] = a.Cp[b.Cp[i]]
		r.Co[i] = (a.Co[b.Cp[i]] + b.Co[i]) % 3
	}
	for i := 0; i < 12; i++ {
		r.Ep[i] = a.Ep[b.Ep[i]]
		r.Eo[i] = (a.Eo[b.Ep[i]] + b.Eo[i]) % 2
	}
	return r
}

// Apply executes one move on the state and returns the result.
func (c CubieCube) Apply(m Move) CubieCube {
	r := c
	for i := 0; i < m.Turns; i++ {
		r = Multiply(r, baseMoves[m.Face])
	}
	return r
}

// ApplyAll executes a move sequence in order.
func (c CubieCube) ApplyAll(moves []Move) CubieCube {
	r := c
	for _, m := range moves {
		r = r.Apply(m)
	}
	return r
}

// Inverse returns the inverse of a move sequence (reversed, turns negated).
func Inverse(moves []Move) []Move {
	out := make([]Move, 0, len(moves))
	for i := len(moves) - 1; i >= 0; i-- {
		out = append(out, Move{Face: moves[i].Face, Turns: 4 - moves[i].Turns})
	}
	return out
}

// AllMoves enumerates the 18 face turns (U, U2, U', R, ... B').
func AllMoves() []Move {
	out := make([]Move, 0, 18)
	for f := 0; f < 6; f++ {
		for t := 1; t <= 3; t++ {
			out = append(out, Move{Face: f, Turns: t})
		}
	}
	return out
}

// Simplify merges consecutive same-face turns (mod 4) and drops null turns,
// repeating until stable. It does not reorder across different faces.
func Simplify(moves []Move) []Move {
	cur := moves
	for {
		out := make([]Move, 0, len(cur))
		for _, m := range cur {
			t := m.Turns % 4
			if t == 0 {
				continue
			}
			if n := len(out); n > 0 && out[n-1].Face == m.Face {
				sum := (out[n-1].Turns + t) % 4
				if sum == 0 {
					out = out[:n-1]
				} else {
					out[n-1].Turns = sum
				}
				continue
			}
			out = append(out, Move{Face: m.Face, Turns: t})
		}
		if len(out) == len(cur) {
			return out
		}
		cur = out
	}
}
