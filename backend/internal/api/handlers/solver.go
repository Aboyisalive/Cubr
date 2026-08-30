package handlers

import (
	"math/rand"
	"net/http"
	"strconv"

	"github.com/Aboyisalive/cubr/backend/internal/solver/kociemba"
	"github.com/Aboyisalive/cubr/backend/pkg/models"
	cubecore "github.com/Aboyisalive/cubr/shared/cube-core"
)

// Methods handles GET /api/solver/methods.
func (d *Deps) Methods(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, cubecore.Methods)
}

// Validate handles POST /api/solver/validate.
func (d *Deps) Validate(w http.ResponseWriter, r *http.Request) {
	var req models.CubeStateRequest
	if !readJSON(w, r, &req) {
		return
	}
	writeJSON(w, http.StatusOK, cubecore.Validate(req.Facelets))
}

// Solve handles POST /api/solver/solve. Method "kociemba" (default) returns a
// near-optimal machine solution; "beginner" returns a staged layer-by-layer plan.
func (d *Deps) Solve(w http.ResponseWriter, r *http.Request) {
	var req models.CubeStateRequest
	if !readJSON(w, r, &req) {
		return
	}
	if v := cubecore.Validate(req.Facelets); !v.Valid {
		writeJSON(w, http.StatusUnprocessableEntity, v)
		return
	}

	switch req.Method {
	case "beginner":
		res, err := cubecore.Solve(req.Facelets)
		if err != nil {
			writeError(w, http.StatusUnprocessableEntity, "beginner planner failed: "+err.Error())
			return
		}
		stages := make([]models.SolveStage, len(res.Stages))
		for i, st := range res.Stages {
			stages[i] = models.SolveStage{Name: st.Name, Moves: st.Moves}
		}
		writeJSON(w, http.StatusOK, models.SolveResponse{
			Solution:  res.Solution(),
			MoveCount: res.MoveCount(),
			Method:    "beginner",
			Stages:    stages,
		})
	case "", "kociemba":
		cc, err := cubecore.FaceletsToCubie(req.Facelets)
		if err != nil {
			writeError(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		moves, err := kociemba.Solve(cc, nil)
		if err != nil {
			writeError(w, http.StatusUnprocessableEntity, "solver failed: "+err.Error())
			return
		}
		writeJSON(w, http.StatusOK, models.SolveResponse{
			Solution:  cubecore.FormatMoves(moves),
			MoveCount: len(moves),
			Method:    "kociemba",
		})
	default:
		writeError(w, http.StatusBadRequest, `unknown method (want "kociemba" or "beginner")`)
	}
}

// Scramble handles GET /api/solver/scramble?moves=n.
func (d *Deps) Scramble(w http.ResponseWriter, r *http.Request) {
	n := 25
	if q := r.URL.Query().Get("moves"); q != "" {
		if v, err := strconv.Atoi(q); err == nil && v >= 1 && v <= 100 {
			n = v
		}
	}
	moves := cubecore.GenerateScramble(n, rand.New(rand.NewSource(rand.Int63())))
	state := cubecore.ScrambledState(moves)
	writeJSON(w, http.StatusOK, models.ScrambleResponse{
		Scramble: cubecore.FormatMoves(moves),
		State:    state.ToFacelets(),
	})
}
