package kociemba

import (
	"errors"
	"fmt"
	"time"

	cubecore "github.com/Aboyisalive/cubr/shared/cube-core"
)

// Options tunes the two-phase search.
type Options struct {
	// MaxLength is the longest acceptable solution (default 24 moves).
	MaxLength int
	// Timeout bounds the search for shorter solutions; the first solution found
	// is kept regardless, so Solve never fails once one exists (default 1s).
	Timeout time.Duration
	// GoodEnough stops the search early once a solution this short is found
	// (default 21).
	GoodEnough int
}

func (o *Options) withDefaults() Options {
	out := Options{MaxLength: 24, Timeout: time.Second, GoodEnough: 21}
	if o == nil {
		return out
	}
	if o.MaxLength > 0 {
		out.MaxLength = o.MaxLength
	}
	if o.Timeout > 0 {
		out.Timeout = o.Timeout
	}
	if o.GoodEnough > 0 {
		out.GoodEnough = o.GoodEnough
	}
	return out
}

var ErrUnsolvable = errors.New("kociemba: state is not solvable")

type search struct {
	cube     cubecore.CubieCube
	deadline time.Time
	opts     Options

	best []cubecore.Move

	path1 [16]int // phase-1 move indices (into phase1Moves)
	path2 [20]int // phase-2 move indices (into phase2Moves)
}

// Solve finds a solution for the given cubie state using the two-phase
// algorithm. The state must be solvable (validate first). Solutions are
// typically ~19–23 moves.
func Solve(cc cubecore.CubieCube, opts *Options) ([]cubecore.Move, error) {
	InitTables()
	o := opts.withDefaults()

	if cc.IsSolved() {
		return []cubecore.Move{}, nil
	}

	s := &search{cube: cc, deadline: time.Now().Add(o.Timeout), opts: o}

	twist, flip, slice := getTwist(&cc), getFlip(&cc), getSlice(&cc)
	for d1 := 0; d1 <= 12; d1++ {
		// Deeper phase-1 prefixes cannot improve on a best this short; the
		// GoodEnough cutoff is only honored between depths so every candidate at
		// the current depth gets considered (a mid-depth stop can freeze an
		// early, longer solution while a 1-move answer sits later in move order).
		if s.best != nil && (len(s.best) <= s.opts.GoodEnough || d1 >= len(s.best)) {
			break
		}
		if s.timedOut() {
			break
		}
		s.phase1(twist, flip, slice, d1, 0, -1)
	}
	if s.best == nil {
		return nil, fmt.Errorf("kociemba: no solution within %d moves (state unsolvable?)", o.MaxLength)
	}
	return s.best, nil
}

// SolveFacelets validates and solves a facelet string.
func SolveFacelets(facelets string, opts *Options) ([]cubecore.Move, error) {
	if v := cubecore.Validate(facelets); !v.Valid {
		return nil, ErrUnsolvable
	}
	cc, err := cubecore.FaceletsToCubie(facelets)
	if err != nil {
		return nil, ErrUnsolvable
	}
	return Solve(cc, opts)
}

func (s *search) timedOut() bool {
	return s.best != nil && time.Now().After(s.deadline)
}

// phase1 runs DFS at exactly `togo` remaining moves toward the H subgroup.
func (s *search) phase1(twist, flip, slice, togo, depth, lastFace int) {
	if s.timedOut() {
		return
	}
	if togo == 0 {
		if twist == 0 && flip == 0 && slice == int(sliceGoal) {
			// Dedup: a phase-1 solution ending in an H move is a shorter phase-1
			// solution plus a phase-2 prefix; it was already covered.
			if depth > 0 && isPhase2Move[s.path1[depth-1]] {
				return
			}
			s.startPhase2(depth)
		}
		return
	}
	// Prune on distance lower bounds.
	if int(pruneTwistSlice[twist*nSlice+slice]) > togo ||
		int(pruneFlipSlice[flip*nSlice+slice]) > togo {
		return
	}
	for mi := 0; mi < nMoves1; mi++ {
		f := phase1Moves[mi].Face
		if f == lastFace || (f+3 == lastFace) { // same face, or fixed axis order
			continue
		}
		s.path1[depth] = mi
		s.phase1(int(twistMove[twist][mi]), int(flipMove[flip][mi]), int(sliceMove[slice][mi]),
			togo-1, depth+1, f)
		if s.timedOut() {
			return
		}
	}
}

// startPhase2 applies the phase-1 prefix and searches phase 2 within the
// remaining move budget.
func (s *search) startPhase2(len1 int) {
	moves1 := make([]cubecore.Move, len1)
	for i := 0; i < len1; i++ {
		moves1[i] = phase1Moves[s.path1[i]]
	}
	c2 := s.cube.ApplyAll(moves1)

	cperm, ude, sperm := getCPerm(&c2), getUDEdges(&c2), getSlicePerm(&c2)

	budget := s.opts.MaxLength - len1
	if s.best != nil && len(s.best)-1-len1 < budget {
		budget = len(s.best) - 1 - len1
	}
	lastFace := -1
	if len1 > 0 {
		lastFace = phase1Moves[s.path1[len1-1]].Face
	}
	for d2 := 0; d2 <= budget && d2 <= 18; d2++ {
		if s.phase2(cperm, ude, sperm, d2, 0, lastFace) {
			moves2 := make([]cubecore.Move, d2)
			for i := 0; i < d2; i++ {
				moves2[i] = phase2Moves[s.path2[i]]
			}
			sol := cubecore.Simplify(append(moves1, moves2...))
			if s.best == nil || len(sol) < len(s.best) {
				s.best = sol
			}
			return
		}
		if s.timedOut() {
			return
		}
	}
}

// phase2 runs DFS at exactly `togo` remaining H moves toward solved; returns
// true when a solution is written into path2.
func (s *search) phase2(cperm, ude, sperm, togo, depth, lastFace int) bool {
	if togo == 0 {
		return cperm == 0 && ude == 0 && sperm == 0
	}
	if int(pruneCPermSPerm[cperm*nSlicePerm+sperm]) > togo ||
		int(pruneUDESPerm[ude*nSlicePerm+sperm]) > togo {
		return false
	}
	for mi := 0; mi < nMoves2; mi++ {
		f := phase2Moves[mi].Face
		if f == lastFace || (f+3 == lastFace) {
			continue
		}
		s.path2[depth] = mi
		if s.phase2(int(cpermMove[cperm][mi]), int(udeMove[ude][mi]), int(spermMove[sperm][mi]),
			togo-1, depth+1, f) {
			return true
		}
	}
	return false
}
