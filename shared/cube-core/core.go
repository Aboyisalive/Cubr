package cubecore

import "time"

// CubeState is the shared app-facing representation of a cube state. It mirrors
// the TypeScript contract in shared/types/cube_state.ts while reusing the Go
// cubie representation for solving and validation.
type CubeState struct {
	Facelets string            `json:"facelets"`
	Scheme   map[string]string `json:"scheme,omitempty"`
}

// SolveStep mirrors one named sub-step in a solve plan.
type SolveStep = SolveStage

// SolvePlan is a typed alias to SolveResult so the app can talk in domain terms
// without losing the concrete solver output shape.
type SolvePlan = SolveResult

// Scramble is a concrete move sequence that produces a randomization of the cube.
type Scramble []Move

func (s Scramble) String() string {
	return FormatMoves(s)
}

// TimerPhase mirrors the frontend lifecycle for the timer state machine.
type TimerPhase string

const (
	TimerIdle       TimerPhase = "idle"
	TimerInspection TimerPhase = "inspection"
	TimerReady      TimerPhase = "ready"
	TimerRunning    TimerPhase = "running"
	TimerStopped    TimerPhase = "stopped"
)

// TimerSession tracks a solve attempt from inspection through completion.
type TimerSession struct {
	ID           string     `json:"id"`
	StartedAt    time.Time  `json:"startedAt"`
	FinishedAt   *time.Time `json:"finishedAt,omitempty"`
	Phase        TimerPhase `json:"phase"`
	InspectionMs int64      `json:"inspectionMs,omitempty"`
	ElapsedMs    int64      `json:"elapsedMs"`
	Scramble     string     `json:"scramble,omitempty"`
	State        string     `json:"state,omitempty"`
	Method       string     `json:"method,omitempty"`
}

// TrainingCase represents a reusable cube case for guided training and method
// drills. It naturally pairs with the algorithm library while remaining generic
// enough for future exercises and custom case types.
type TrainingCase struct {
	ID        string    `json:"id"`
	Kind      string    `json:"kind"`
	Name      string    `json:"name"`
	State     string    `json:"state"`
	Moves     string    `json:"moves,omitempty"`
	Notes     string    `json:"notes,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}
