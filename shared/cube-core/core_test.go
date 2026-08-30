package cubecore

import (
	"testing"
	"time"
)

func TestCoreEngineContracts(t *testing.T) {
	if got := (Scramble{{Face: FaceU, Turns: 1}, {Face: FaceR, Turns: 2}}).String(); got != "U R2" {
		t.Fatalf("scramble string mismatch: %q", got)
	}

	cs := CubeState{Facelets: SolvedFacelets}
	if cs.Facelets != SolvedFacelets {
		t.Fatal("cube state facelets not preserved")
	}

	plan := SolvePlan{Moves: []Move{{Face: FaceU, Turns: 1}}, Stages: []SolveStage{{Name: "cross", Moves: "U"}}}
	if len(plan.Moves) != 1 || plan.Stages[0].Name != "cross" {
		t.Fatalf("solve plan contract mismatch: %+v", plan)
	}

	finished := time.Now().UTC()
	session := TimerSession{ID: "ts_1", StartedAt: time.Now().UTC(), FinishedAt: &finished, Phase: TimerRunning, ElapsedMs: 1234, Scramble: "R U R' U'"}
	if session.Phase != TimerRunning || session.ElapsedMs != 1234 {
		t.Fatalf("timer session contract mismatch: %+v", session)
	}

	caseDef := TrainingCase{ID: "tc_1", Kind: "OLL", Name: "Sune", State: SolvedFacelets, Moves: "R U R' U R U2 R'"}
	if caseDef.Kind != "OLL" || caseDef.Moves == "" {
		t.Fatalf("training case contract mismatch: %+v", caseDef)
	}
}
