// Package averages implements WCA-style rolling averages, personal bests, and
// solve streaks over a user's solve history.
package averages

import (
	"time"

	"github.com/Aboyisalive/cubr/backend/pkg/models"
)

// plus2Ms is the WCA +2 penalty.
const plus2Ms = 2000

// effective returns the counting time for a solve and whether it is a DNF.
func effective(r models.SolveRecord) (int64, bool) {
	switch r.Penalty {
	case "dnf":
		return 0, true
	case "plus2":
		return r.TimeMs + plus2Ms, false
	default:
		return r.TimeMs, false
	}
}

// trimFor is how many results are dropped from each end of an average-of-n
// (WCA: 1 for Ao5/Ao12, 5% for Ao100).
func trimFor(n int) int {
	if n >= 100 {
		return n / 20
	}
	return 1
}

// AoN computes the average of the most recent n solves (input newest-first).
// Returns nil when fewer than n solves exist; AverageMs is null when DNFs
// exceed the trim allowance.
func AoN(solves []models.SolveRecord, n int) *models.AverageOf {
	if len(solves) < n {
		return nil
	}
	window := solves[:n]
	trim := trimFor(n)

	times := make([]int64, 0, n)
	dnfs := 0
	for _, r := range window {
		t, dnf := effective(r)
		if dnf {
			dnfs++
		} else {
			times = append(times, t)
		}
	}
	if dnfs > trim {
		return &models.AverageOf{N: n, AverageMs: nil}
	}
	// Sort counting times; drop `trim` best; drop `trim` worst with DNFs
	// counting as the worst results first.
	sortInt64(times)
	lo := trim
	hi := len(times) - (trim - dnfs)
	var sum int64
	for _, t := range times[lo:hi] {
		sum += t
	}
	avg := sum / int64(hi-lo)
	return &models.AverageOf{N: n, AverageMs: &avg}
}

// Best returns the fastest counting single, or nil if none.
func Best(solves []models.SolveRecord) *int64 {
	var best *int64
	for _, r := range solves {
		t, dnf := effective(r)
		if dnf {
			continue
		}
		if best == nil || t < *best {
			v := t
			best = &v
		}
	}
	return best
}

// Streak counts consecutive days with at least one solve, ending today or
// yesterday (input newest-first, CreatedAt in RFC3339).
func Streak(solves []models.SolveRecord, now time.Time) int {
	days := map[string]bool{}
	for _, r := range solves {
		if t, err := time.Parse(time.RFC3339, r.CreatedAt); err == nil {
			days[t.UTC().Format("2006-01-02")] = true
		}
	}
	day := now.UTC()
	if !days[day.Format("2006-01-02")] {
		day = day.AddDate(0, 0, -1) // streak not broken until today ends
	}
	streak := 0
	for days[day.Format("2006-01-02")] {
		streak++
		day = day.AddDate(0, 0, -1)
	}
	return streak
}

func sortInt64(a []int64) {
	for i := 1; i < len(a); i++ {
		for j := i; j > 0 && a[j] < a[j-1]; j-- {
			a[j], a[j-1] = a[j-1], a[j]
		}
	}
}
