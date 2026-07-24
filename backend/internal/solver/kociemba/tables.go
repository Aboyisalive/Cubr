// Package kociemba implements Herbert Kociemba's two-phase algorithm on top of
// the shared cube-core cubie model. Phase 1 reduces an arbitrary state into the
// subgroup H = <U, D, R2, F2, L2, B2>; phase 2 solves within H. Coordinates,
// move tables, and pruning tables are generated in memory on first use (~1s).
package kociemba

import (
	"sync"

	cubecore "github.com/Aboyisalive/cubr/shared/cube-core"
)

// Coordinate space sizes.
const (
	nTwist     = 2187  // 3^7 corner orientations
	nFlip      = 2048  // 2^11 edge orientations
	nSlice     = 495   // C(12,4) positions of the E-slice edges
	nCPerm     = 40320 // 8! corner permutations
	nUDEdges   = 40320 // 8! permutations of the U/D-layer edges (phase 2)
	nSlicePerm = 24    // 4! permutations within the E-slice (phase 2)
	nMoves1    = 18
	nMoves2    = 10
)

// phase1Moves is all 18 face turns; phase2Moves is the H-group generator set.
var (
	phase1Moves = cubecore.AllMoves()
	phase2Moves = []cubecore.Move{
		{Face: cubecore.FaceU, Turns: 1}, {Face: cubecore.FaceU, Turns: 2}, {Face: cubecore.FaceU, Turns: 3},
		{Face: cubecore.FaceD, Turns: 1}, {Face: cubecore.FaceD, Turns: 2}, {Face: cubecore.FaceD, Turns: 3},
		{Face: cubecore.FaceR, Turns: 2}, {Face: cubecore.FaceF, Turns: 2},
		{Face: cubecore.FaceL, Turns: 2}, {Face: cubecore.FaceB, Turns: 2},
	}
	// isPhase2Move[i] reports whether phase-1 move index i is also an H move.
	isPhase2Move [nMoves1]bool
)

// Move tables: next coordinate after applying a move index.
var (
	twistMove [nTwist][nMoves1]uint16
	flipMove  [nFlip][nMoves1]uint16
	sliceMove [nSlice][nMoves1]uint16

	cpermMove [nCPerm][nMoves2]uint16
	udeMove   [nUDEdges][nMoves2]uint16
	spermMove [nSlicePerm][nMoves2]uint8
)

// Pruning tables: BFS distance-to-goal lower bounds over coordinate pairs.
var (
	pruneTwistSlice []uint8 // twist*nSlice + slice
	pruneFlipSlice  []uint8 // flip*nSlice + slice
	pruneCPermSPerm []uint8 // cperm*nSlicePerm + sperm
	pruneUDESPerm   []uint8 // udedges*nSlicePerm + sperm
)

// sliceGoal is the slice coordinate of the solved cube (E-slice edges at home).
var sliceGoal uint16

var initOnce sync.Once

// InitTables builds all move and pruning tables. Safe to call repeatedly; the
// first Solve triggers it implicitly.
func InitTables() {
	initOnce.Do(buildTables)
}

// --- coordinate extraction / representatives -------------------------------

func getTwist(c *cubecore.CubieCube) int {
	t := 0
	for i := 0; i < 7; i++ {
		t = 3*t + c.Co[i]
	}
	return t
}

func setTwist(c *cubecore.CubieCube, t int) {
	sum := 0
	for i := 6; i >= 0; i-- {
		c.Co[i] = t % 3
		sum += c.Co[i]
		t /= 3
	}
	c.Co[7] = (3 - sum%3) % 3
}

func getFlip(c *cubecore.CubieCube) int {
	f := 0
	for i := 0; i < 11; i++ {
		f = 2*f + c.Eo[i]
	}
	return f
}

func setFlip(c *cubecore.CubieCube, f int) {
	sum := 0
	for i := 10; i >= 0; i-- {
		c.Eo[i] = f % 2
		sum += c.Eo[i]
		f /= 2
	}
	c.Eo[11] = sum % 2
}

// binomial table up to 12.
var choose [13][5]int

func initChoose() {
	for n := 0; n <= 12; n++ {
		choose[n][0] = 1
		for k := 1; k <= 4 && k <= n; k++ {
			c := 1
			for i := 0; i < k; i++ {
				c = c * (n - i) / (i + 1)
			}
			choose[n][k] = c
		}
	}
}

// getSlice ranks which 4 slots hold E-slice edges (combinatorial number system).
func getSlice(c *cubecore.CubieCube) int {
	r, k := 0, 0
	for slot := 0; slot < 12; slot++ {
		if c.Ep[slot] >= 8 {
			k++
			r += choose[slot][k]
		}
	}
	return r
}

// setSlice builds a representative edge permutation for a slice rank: E-slice
// pieces in the ranked slots (in order), remaining pieces 0..7 fill the rest.
func setSlice(c *cubecore.CubieCube, r int) {
	var slots [4]int
	for k := 4; k >= 1; k-- {
		// largest p with choose[p][k] <= r
		p := k - 1
		for p+1 < 12 && choose[p+1][k] <= r {
			p++
		}
		slots[k-1] = p
		r -= choose[p][k]
	}
	next, si := 0, 0
	for slot := 0; slot < 12; slot++ {
		if si < 4 && slots[si] == slot {
			c.Ep[slot] = 8 + si
			si++
		} else {
			c.Ep[slot] = next
			next++
		}
	}
}

// rankPerm ranks a permutation of {0..n-1} in mixed radix (Lehmer code), 0 for identity.
func rankPerm(p []int) int {
	idx := 0
	for i := len(p) - 1; i > 0; i-- {
		s := 0
		for j := 0; j < i; j++ {
			if p[j] > p[i] {
				s++
			}
		}
		idx = (idx + s) * i
	}
	return idx
}

// unrankPermSimple inverts rankPerm by factorial-base decode.
func unrankPermSimple(n, idx int) []int {
	// digits: for i from 1..n-1, d[i] = number of earlier entries greater than p[i].
	d := make([]int, n)
	for i := 1; i < n; i++ {
		d[i] = idx % (i + 1)
		idx /= (i + 1)
	}
	p := make([]int, n)
	used := make([]bool, n)
	for i := n - 1; i >= 0; i-- {
		// p[i] is the (d[i]+1)-th largest unused value... rankPerm counts earlier
		// entries greater than p[i]; reconstruct from the highest index down.
		cnt := 0
		for v := n - 1; v >= 0; v-- {
			if !used[v] {
				if cnt == d[i] {
					p[i] = v
					used[v] = true
					break
				}
				cnt++
			}
		}
	}
	return p
}

func getCPerm(c *cubecore.CubieCube) int  { return rankPerm(c.Cp[:]) }
func getUDEdges(c *cubecore.CubieCube) int {
	return rankPerm(c.Ep[:8])
}
func getSlicePerm(c *cubecore.CubieCube) int {
	var q [4]int
	for i := 0; i < 4; i++ {
		q[i] = c.Ep[8+i] - 8
	}
	return rankPerm(q[:])
}

// --- table construction ----------------------------------------------------

func buildTables() {
	initChoose()
	for i, m := range phase1Moves {
		for _, h := range phase2Moves {
			if m == h {
				isPhase2Move[i] = true
			}
		}
	}

	solved := cubecore.SolvedCubie()
	sliceGoal = uint16(getSlice(&solved))

	// Twist moves (corners only).
	for t := 0; t < nTwist; t++ {
		c := cubecore.SolvedCubie()
		setTwist(&c, t)
		for mi, m := range phase1Moves {
			n := c.Apply(m)
			twistMove[t][mi] = uint16(getTwist(&n))
		}
	}
	// Flip moves (edges only).
	for f := 0; f < nFlip; f++ {
		c := cubecore.SolvedCubie()
		setFlip(&c, f)
		for mi, m := range phase1Moves {
			n := c.Apply(m)
			flipMove[f][mi] = uint16(getFlip(&n))
		}
	}
	// Slice moves.
	for s := 0; s < nSlice; s++ {
		c := cubecore.SolvedCubie()
		setSlice(&c, s)
		for mi, m := range phase1Moves {
			n := c.Apply(m)
			sliceMove[s][mi] = uint16(getSlice(&n))
		}
	}
	// Corner permutation moves (phase-2 move set).
	for r := 0; r < nCPerm; r++ {
		c := cubecore.SolvedCubie()
		p := unrankPermSimple(8, r)
		copy(c.Cp[:], p)
		for mi, m := range phase2Moves {
			n := c.Apply(m)
			cpermMove[r][mi] = uint16(getCPerm(&n))
		}
	}
	// UD-edge permutation moves (phase-2: slice edges stay put).
	for r := 0; r < nUDEdges; r++ {
		c := cubecore.SolvedCubie()
		p := unrankPermSimple(8, r)
		copy(c.Ep[:8], p)
		for mi, m := range phase2Moves {
			n := c.Apply(m)
			udeMove[r][mi] = uint16(getUDEdges(&n))
		}
	}
	// Slice permutation moves.
	for r := 0; r < nSlicePerm; r++ {
		c := cubecore.SolvedCubie()
		p := unrankPermSimple(4, r)
		for i := 0; i < 4; i++ {
			c.Ep[8+i] = 8 + p[i]
		}
		for mi, m := range phase2Moves {
			n := c.Apply(m)
			spermMove[r][mi] = uint8(getSlicePerm(&n))
		}
	}

	pruneTwistSlice = bfsPrune(nTwist, int(sliceGoal), func(a, s, mi int) (int, int) {
		return int(twistMove[a][mi]), int(sliceMove[s][mi])
	}, 0, nMoves1)
	pruneFlipSlice = bfsPrune(nFlip, int(sliceGoal), func(a, s, mi int) (int, int) {
		return int(flipMove[a][mi]), int(sliceMove[s][mi])
	}, 0, nMoves1)
	pruneCPermSPerm = bfsPrune2(nCPerm, func(a, s, mi int) (int, int) {
		return int(cpermMove[a][mi]), int(spermMove[s][mi])
	})
	pruneUDESPerm = bfsPrune2(nUDEdges, func(a, s, mi int) (int, int) {
		return int(udeMove[a][mi]), int(spermMove[s][mi])
	})
}

// bfsPrune fills distances over the product space (a in [0,nA), slice in [0,nSlice))
// starting from (goalA, goalSlice), exploring with the phase-1 move set.
func bfsPrune(nA, goalSlice int, step func(a, s, mi int) (int, int), goalA, nm int) []uint8 {
	dist := make([]uint8, nA*nSlice)
	for i := range dist {
		dist[i] = 0xFF
	}
	frontier := []int{goalA*nSlice + goalSlice}
	dist[frontier[0]] = 0
	for d := uint8(0); len(frontier) > 0; d++ {
		var next []int
		for _, idx := range frontier {
			a, s := idx/nSlice, idx%nSlice
			for mi := 0; mi < nm; mi++ {
				na, ns := step(a, s, mi)
				nidx := na*nSlice + ns
				if dist[nidx] == 0xFF {
					dist[nidx] = d + 1
					next = append(next, nidx)
				}
			}
		}
		frontier = next
	}
	return dist
}

// bfsPrune2 fills distances over (a in [0,nA), sperm in [0,24)) from (0,0) with
// the phase-2 move set.
func bfsPrune2(nA int, step func(a, s, mi int) (int, int)) []uint8 {
	dist := make([]uint8, nA*nSlicePerm)
	for i := range dist {
		dist[i] = 0xFF
	}
	frontier := []int{0}
	dist[0] = 0
	for d := uint8(0); len(frontier) > 0; d++ {
		var next []int
		for _, idx := range frontier {
			a, s := idx/nSlicePerm, idx%nSlicePerm
			for mi := 0; mi < nMoves2; mi++ {
				na, ns := step(a, s, mi)
				nidx := na*nSlicePerm + ns
				if dist[nidx] == 0xFF {
					dist[nidx] = d + 1
					next = append(next, nidx)
				}
			}
		}
		frontier = next
	}
	return dist
}
