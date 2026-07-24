package cubecore

import (
	"errors"
	"fmt"
)

// SolveStage is one named step of a solve plan (feeds the guide engine later).
type SolveStage struct {
	Name  string `json:"name"`
	Moves string `json:"moves"`
}

// SolveResult is a full beginner-method solve plan for a cube state.
type SolveResult struct {
	Moves  []Move
	Stages []SolveStage
}

// MoveCount returns the length of the simplified solution.
func (r *SolveResult) MoveCount() int { return len(r.Moves) }

// Solution returns the simplified solution in WCA notation.
func (r *SolveResult) Solution() string { return FormatMoves(r.Moves) }

func mustParse(s string) []Move {
	m, err := ParseMoves(s)
	if err != nil {
		panic(err)
	}
	return m
}

// Named algorithms used by the beginner planner.
var (
	algTrigger     = mustParse("R U R' U'")               // first-layer corner insert
	algRightInsert = mustParse("U R U' R' U' F' U F")     // second-layer right insert
	algLeftInsert  = mustParse("U' L' U L U F U' F'")     // second-layer left insert
	algEO          = mustParse("F R U R' U' F'")          // last-layer cross
	algSune        = mustParse("R U R' U R U2 R'")        // last-layer edge cycle
	algNiklas      = mustParse("U R U' L' U R' U' L")     // last-layer corner cycle
	algAPerm       = mustParse("R' F R' B2 R F' R' B2 R2")// last-layer corner cycle
	algTwist       = mustParse("R' D' R D")               // last-layer corner twist
)

// sigma rotates a face one step around the U axis: F→R→B→L→F (U, D fixed).
var sigma = [6]int{FaceU, FaceB, FaceR, FaceD, FaceF, FaceL}

// mapMoves conjugates an algorithm k quarter-rotations around the U axis, so a
// sequence written for the F/R slots applies to any of the four slot positions.
func mapMoves(alg []Move, k int) []Move {
	out := make([]Move, len(alg))
	for i, m := range alg {
		f := m.Face
		for j := 0; j < k; j++ {
			f = sigma[f]
		}
		out[i] = Move{Face: f, Turns: m.Turns}
	}
	return out
}

// Slot geometry for the rotation mapping (k = quarter-rotations from the F/R slot).
var (
	cornerSlotRot = map[int]int{DFR: 0, DRB: 1, DBL: 2, DLF: 3}
	aboveSlot     = [4]int{URF, UBR, ULB, UFL} // U slot above each D slot, by k
	middleSlotRot = map[int]int{FR: 0, BR: 1, BL: 2, FL: 3}
	sideIdxOf     = [4]int{10, 19, 37, 46}                     // side facelet of UR, UF, UL, UB
	uSlotOfFace   = map[byte]int{'R': UR, 'F': UF, 'L': UL, 'B': UB}
	rightNeighbor = map[byte]byte{'F': 'R', 'R': 'B', 'B': 'L', 'L': 'F'}
	rotAsFront    = map[byte]int{'F': 0, 'R': 1, 'B': 2, 'L': 3}
)

func slotOfCorner(c CubieCube, piece int) int {
	for i := 0; i < 8; i++ {
		if c.Cp[i] == piece {
			return i
		}
	}
	return -1
}

func slotOfEdge(c CubieCube, piece int) int {
	for i := 0; i < 12; i++ {
		if c.Ep[i] == piece {
			return i
		}
	}
	return -1
}

// solveCtx accumulates moves per stage while advancing the working state.
type solveCtx struct {
	state  CubieCube
	stages []SolveStage
	all    []Move
	cur    []Move
}

func (s *solveCtx) apply(moves []Move) {
	s.state = s.state.ApplyAll(moves)
	s.cur = append(s.cur, moves...)
}

func (s *solveCtx) endStage(name string) {
	moves := Simplify(s.cur)
	s.stages = append(s.stages, SolveStage{Name: name, Moves: FormatMoves(moves)})
	s.all = append(s.all, s.cur...)
	s.cur = nil
}

// Solve produces a beginner-method solve plan for a facelet state. The input
// must pass Validate; the returned move sequence takes the state to solved.
func Solve(facelets string) (*SolveResult, error) {
	if v := Validate(facelets); !v.Valid {
		return nil, fmt.Errorf("invalid cube state: %s", v.Errors[0].Message)
	}
	start, err := FaceletsToCubie(facelets)
	if err != nil {
		return nil, err
	}
	ctx := &solveCtx{state: start}

	if err := solveCross(ctx); err != nil {
		return nil, err
	}
	ctx.endStage("cross")
	if err := solveFirstLayerCorners(ctx); err != nil {
		return nil, err
	}
	ctx.endStage("first-layer-corners")
	if err := solveSecondLayerEdges(ctx); err != nil {
		return nil, err
	}
	ctx.endStage("second-layer-edges")
	if err := solveLastLayerCross(ctx); err != nil {
		return nil, err
	}
	ctx.endStage("last-layer-cross")
	if err := solveLastLayerEdges(ctx); err != nil {
		return nil, err
	}
	ctx.endStage("last-layer-edges")
	if err := solveLastLayerCornerPerm(ctx); err != nil {
		return nil, err
	}
	ctx.endStage("last-layer-corner-permutation")
	if err := solveLastLayerCornerOrient(ctx); err != nil {
		return nil, err
	}
	ctx.endStage("last-layer-corner-orientation")

	if !ctx.state.IsSolved() {
		return nil, errors.New("internal solver error: final state not solved")
	}
	return &SolveResult{Moves: Simplify(ctx.all), Stages: ctx.stages}, nil
}

// --- Stage 1: cross -------------------------------------------------------
// Exact BFS over the positions/orientations of the four D edges only (the rest
// of the cube is ignored), which keeps the search space tiny (≤ 24^4 states)
// while still yielding a near-optimal cross.

var crossPieces = [4]int{DR, DF, DL, DB}

func crossSig(c CubieCube) uint32 {
	var sig uint32
	for i, p := range crossPieces {
		s := slotOfEdge(c, p)
		sig |= uint32(s<<1|c.Eo[s]) << (5 * i)
	}
	return sig
}

func solveCross(ctx *solveCtx) error {
	goal := crossSig(SolvedCubie())
	if crossSig(ctx.state) == goal {
		return nil
	}
	type node struct {
		state CubieCube
		prev  int
		mv    Move
	}
	nodes := []node{{state: ctx.state, prev: -1}}
	visited := map[uint32]bool{crossSig(ctx.state): true}
	moves := AllMoves()
	for head := 0; head < len(nodes); head++ {
		for _, m := range moves {
			next := nodes[head].state.Apply(m)
			sig := crossSig(next)
			if visited[sig] {
				continue
			}
			visited[sig] = true
			nodes = append(nodes, node{state: next, prev: head, mv: m})
			if sig == goal {
				// Reconstruct the move path.
				var path []Move
				for i := len(nodes) - 1; i > 0; i = nodes[i].prev {
					path = append([]Move{nodes[i].mv}, path...)
				}
				ctx.apply(path)
				return nil
			}
		}
		if len(nodes) > 2_000_000 {
			break
		}
	}
	return errors.New("cross search exhausted")
}

// --- Stage 2: first-layer corners -----------------------------------------
// Classic procedure: pop a misplaced D corner into the U layer with its slot's
// trigger, align it above its home slot, then repeat the trigger until inserted.

func solveFirstLayerCorners(ctx *solveCtx) error {
	for _, piece := range []int{DFR, DRB, DBL, DLF} {
		k := cornerSlotRot[piece]
		trigger := mapMoves(algTrigger, k)
		for iter := 0; ; iter++ {
			if iter > 40 {
				return errors.New("first-layer corner stage did not converge")
			}
			if ctx.state.Cp[piece] == piece && ctx.state.Co[piece] == 0 {
				break
			}
			s := slotOfCorner(ctx.state, piece)
			if s >= DFR {
				// Stuck in a D slot (wrong slot, or right slot twisted): pop it out.
				ctx.apply(mapMoves(algTrigger, cornerSlotRot[s]))
				continue
			}
			// In the U layer: align above the home slot, then trigger.
			if n := (aboveSlot[k] - s + 4) % 4; n > 0 {
				ctx.apply([]Move{{Face: FaceU, Turns: n}})
			}
			ctx.apply(trigger)
		}
	}
	return nil
}

// --- Stage 3: second-layer edges ------------------------------------------
// Standard beginner inserts: bring the edge over the center matching its side
// sticker, then insert right or left; eject first if stuck in the middle layer.

func solveSecondLayerEdges(ctx *solveCtx) error {
	for _, piece := range []int{FR, BR, BL, FL} {
		for iter := 0; ; iter++ {
			if iter > 40 {
				return errors.New("second-layer edge stage did not converge")
			}
			if ctx.state.Ep[piece] == piece && ctx.state.Eo[piece] == 0 {
				break
			}
			s := slotOfEdge(ctx.state, piece)
			if s >= FR {
				// In a middle slot (wrong slot or flipped): eject to the U layer.
				ctx.apply(mapMoves(algRightInsert, middleSlotRot[s]))
				continue
			}
			// In the U layer. Which color faces sideways stays fixed under U turns.
			f := ctx.state.ToFacelets()
			side := f[sideIdxOf[s]]
			if n := (uSlotOfFace[side] - s + 4) % 4; n > 0 {
				ctx.apply([]Move{{Face: FaceU, Turns: n}})
			}
			a, b := edgeColor[piece][0], edgeColor[piece][1]
			other := a
			if a == side {
				other = b
			}
			if other == rightNeighbor[side] {
				ctx.apply(mapMoves(algRightInsert, rotAsFront[side]))
			} else {
				ctx.apply(mapMoves(algLeftInsert, rotAsFront[side]))
			}
		}
	}
	return nil
}

// --- Stage 4: last-layer cross (edge orientation) -------------------------
// F R U R' U' F' with the standard dot → L-shape → line case positioning.

func solveLastLayerCross(ctx *solveCtx) error {
	for iter := 0; iter < 8; iter++ {
		f := ctx.state.ToFacelets()
		// U-face sticker of the edges at UR, UF, UL, UB.
		uIdx := [4]int{5, 7, 3, 1}
		var oriented [4]bool
		cnt := 0
		for i := 0; i < 4; i++ {
			if f[uIdx[i]] == 'U' {
				oriented[i] = true
				cnt++
			}
		}
		switch cnt {
		case 4:
			return nil
		case 0:
			ctx.apply(algEO)
		case 2:
			rot := func(n int) [4]bool { // oriented pattern after n U turns
				var r [4]bool
				for i := 0; i < 4; i++ {
					r[(i+n)%4] = oriented[i]
				}
				return r
			}
			applied := false
			for n := 0; n < 4 && !applied; n++ {
				p := rot(n)
				lineHorizontal := p[UR] && p[UL]
				lShape := p[UL] && p[UB]
				if lineHorizontal || lShape {
					if n > 0 {
						ctx.apply([]Move{{Face: FaceU, Turns: n}})
					}
					ctx.apply(algEO)
					applied = true
				}
			}
			if !applied {
				return errors.New("last-layer cross: unrecognized 2-edge pattern")
			}
		default:
			return errors.New("last-layer cross: impossible edge orientation parity")
		}
	}
	return errors.New("last-layer cross did not converge")
}

// --- Stages 5-6: last-layer permutations ----------------------------------
// Small breadth-first searches over {U turns + one known cycle algorithm}: the
// space is tiny, the result is the shortest generator sequence, and correctness
// doesn't hinge on hand-enumerated case tables.

func bfsGens(start CubieCube, gens [][]Move, goal func(CubieCube) bool, maxDepth, maxNodes int) ([]Move, bool) {
	if goal(start) {
		return nil, true
	}
	type node struct {
		state CubieCube
		prev  int
		gen   int
	}
	nodes := []node{{state: start, prev: -1, gen: -1}}
	depth := map[int]int{0: 0}
	visited := map[CubieCube]bool{start: true}
	for head := 0; head < len(nodes) && len(nodes) < maxNodes; head++ {
		if depth[head] >= maxDepth {
			continue
		}
		for gi, g := range gens {
			next := nodes[head].state.ApplyAll(g)
			if visited[next] {
				continue
			}
			visited[next] = true
			nodes = append(nodes, node{state: next, prev: head, gen: gi})
			depth[len(nodes)-1] = depth[head] + 1
			if goal(next) {
				var out []Move
				for i := len(nodes) - 1; i > 0; i = nodes[i].prev {
					out = append(mapMoves(gens[nodes[i].gen], 0), out...)
				}
				return out, true
			}
		}
	}
	return nil, false
}

var uTurnGens = [][]Move{
	{{Face: FaceU, Turns: 1}},
	{{Face: FaceU, Turns: 2}},
	{{Face: FaceU, Turns: 3}},
}

func solveLastLayerEdges(ctx *solveCtx) error {
	gens := append(append([][]Move{}, uTurnGens...), algSune)
	moves, ok := bfsGens(ctx.state, gens, func(c CubieCube) bool {
		for e := UR; e <= UB; e++ {
			if c.Ep[e] != e || c.Eo[e] != 0 {
				return false
			}
		}
		return true
	}, 10, 500_000)
	if !ok {
		return errors.New("last-layer edge permutation search exhausted")
	}
	ctx.apply(moves)
	return nil
}

func solveLastLayerCornerPerm(ctx *solveCtx) error {
	gens := append(append([][]Move{}, uTurnGens...), algNiklas, algAPerm)
	moves, ok := bfsGens(ctx.state, gens, func(c CubieCube) bool {
		for i := URF; i <= UBR; i++ {
			if c.Cp[i] != i {
				return false
			}
		}
		for e := 0; e < 12; e++ {
			if c.Ep[e] != e || c.Eo[e] != 0 {
				return false
			}
		}
		return true
	}, 10, 500_000)
	if !ok {
		return errors.New("last-layer corner permutation search exhausted")
	}
	ctx.apply(moves)
	return nil
}

// --- Stage 7: last-layer corner orientation -------------------------------
// The classic finish: twist the corner at URF with repeated R' D' R D, then U to
// bring the next corner in. A single application sends the resident corner into
// the D layer and it only returns on the second, so the algorithm must be applied
// in pairs — checking orientation after an odd application would read a transient
// D-layer occupant. After all four corners the total application count is a
// multiple of six, which provably restores the D layer, and the net U turns cancel.

func solveLastLayerCornerOrient(ctx *solveCtx) error {
	for i := 0; i < 4; i++ {
		for reps := 0; ctx.state.Co[URF] != 0; reps++ {
			if reps > 6 {
				return errors.New("corner orientation did not converge")
			}
			ctx.apply(algTwist)
			ctx.apply(algTwist)
		}
		ctx.apply([]Move{{Face: FaceU, Turns: 1}})
	}
	// Final AUF safety net.
	for r := 0; r < 4; r++ {
		if ctx.state.IsSolved() {
			return nil
		}
		ctx.apply([]Move{{Face: FaceU, Turns: 1}})
	}
	if ctx.state.IsSolved() {
		return nil
	}
	return errors.New("cube not solved after corner orientation")
}
