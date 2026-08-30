// Package models holds the JSON contracts shared with the web frontend. Shapes
// mirror shared/types/*.ts exactly — those TS files are the source of truth.
package models

// User mirrors web/src/store/authSlice.ts User.
type User struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
}

// WaitlistSignup mirrors shared/types/waitlist.ts WaitlistSignupResponse.
type WaitlistSignup struct {
	ID       string `json:"id"`
	Position int    `json:"position"`
}

// SolveRecord mirrors shared/types/solve_record.ts SolveRecord.
type SolveRecord struct {
	ID        string   `json:"id"`
	CreatedAt string   `json:"createdAt"` // ISO-8601
	Scramble  string   `json:"scramble"`
	State     string   `json:"state,omitempty"`
	TimeMs    int64    `json:"timeMs"`
	Method    string   `json:"method"`  // CFOP | Roux | ZZ | Beginner
	Penalty   string   `json:"penalty"` // none | plus2 | dnf
	MoveCount *int     `json:"moveCount,omitempty"`
	TPS       *float64 `json:"tps,omitempty"`
}

// AverageOf mirrors shared/types/solve_record.ts AverageOf.
type AverageOf struct {
	N         int    `json:"n"`
	AverageMs *int64 `json:"averageMs"` // null when a DNF invalidates the average
}

// ProfileStats mirrors shared/types/solve_record.ts ProfileStats.
type ProfileStats struct {
	TotalSolves       int        `json:"totalSolves"`
	BestTimeMs        *int64     `json:"bestTimeMs"` // null with no solves
	StreakDays        int        `json:"streakDays"`
	AlgorithmsLearned int        `json:"algorithmsLearned"`
	Ao5               *AverageOf `json:"ao5,omitempty"`
	Ao12              *AverageOf `json:"ao12,omitempty"`
}

// Algorithm mirrors shared/types/algorithm.ts Algorithm.
type Algorithm struct {
	ID           string   `json:"id"`
	Set          string   `json:"set"` // OLL | PLL | F2L | CROSS | BEGINNER
	Name         string   `json:"name"`
	Moves        string   `json:"moves"`
	Alternatives []string `json:"alternatives,omitempty"`
	Group        string   `json:"group,omitempty"`
	Favorite     bool     `json:"favorite,omitempty"`
	Mastery      *float64 `json:"mastery,omitempty"`
}

// ShelfCardItem mirrors web/src/types/home.ts ShelfCardItem.
type ShelfCardItem struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Subtitle string `json:"subtitle"`
	Kind     string `json:"kind"` // solve | algorithm | scan | guide
	Href     string `json:"href"`
}

// Shelf mirrors web/src/types/home.ts Shelf.
type Shelf struct {
	ID      string          `json:"id"`
	Heading string          `json:"heading"`
	Items   []ShelfCardItem `json:"items"`
}

// CubeStateRequest mirrors shared/types/cube_state.ts CubeState (request body of
// /api/solver/validate and /solve).
type CubeStateRequest struct {
	Facelets string `json:"facelets"`
	// Method optionally selects the solve planner: "kociemba" (default) or "beginner".
	Method string `json:"method,omitempty"`
}

// SolveStage is one named segment of a beginner solve plan.
type SolveStage struct {
	Name  string `json:"name"`
	Moves string `json:"moves"`
}

// SolveResponse extends web/src/hooks/useSolver.ts SolveResponse (extra fields
// are ignored by older clients).
type SolveResponse struct {
	Solution  string       `json:"solution"`
	MoveCount int          `json:"moveCount"`
	Method    string       `json:"method"`
	Stages    []SolveStage `json:"stages,omitempty"`
}

// ScrambleResponse is the body of GET /api/solver/scramble.
type ScrambleResponse struct {
	Scramble string `json:"scramble"`
	State    string `json:"state"`
}
