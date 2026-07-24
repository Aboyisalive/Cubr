package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/Aboyisalive/cubr/backend/internal/api/middleware"
	"github.com/Aboyisalive/cubr/backend/internal/db/sqlite"
	"github.com/Aboyisalive/cubr/backend/internal/stats/averages"
	"github.com/Aboyisalive/cubr/backend/pkg/models"
	cubecore "github.com/Aboyisalive/cubr/shared/cube-core"
)

// learnedThreshold is the mastery level at which an algorithm counts as learned.
const learnedThreshold = 0.8

var validMethods = map[string]bool{"CFOP": true, "Roux": true, "ZZ": true, "Beginner": true}
var validPenalties = map[string]bool{"none": true, "plus2": true, "dnf": true}

// ListSolves handles GET /api/solves?limit=n.
func (d *Deps) ListSolves(w http.ResponseWriter, r *http.Request) {
	limit := 100
	if q := r.URL.Query().Get("limit"); q != "" {
		if v, err := strconv.Atoi(q); err == nil {
			limit = v
		}
	}
	solves, err := d.Store.ListSolves(r.Context(), middleware.UserID(r), limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not list solves")
		return
	}
	writeJSON(w, http.StatusOK, solves)
}

type createSolveRequest struct {
	Scramble  string   `json:"scramble"`
	State     string   `json:"state,omitempty"`
	TimeMs    int64    `json:"timeMs"`
	Method    string   `json:"method"`
	Penalty   string   `json:"penalty,omitempty"`
	MoveCount *int     `json:"moveCount,omitempty"`
	TPS       *float64 `json:"tps,omitempty"`
}

// CreateSolve handles POST /api/solves.
func (d *Deps) CreateSolve(w http.ResponseWriter, r *http.Request) {
	var req createSolveRequest
	if !readJSON(w, r, &req) {
		return
	}
	if req.TimeMs <= 0 {
		writeError(w, http.StatusBadRequest, "timeMs must be positive")
		return
	}
	if req.Scramble != "" {
		if _, err := cubecore.ParseMoves(req.Scramble); err != nil {
			writeError(w, http.StatusBadRequest, "invalid scramble: "+err.Error())
			return
		}
	}
	if req.Method == "" {
		req.Method = "CFOP"
	}
	if !validMethods[req.Method] {
		writeError(w, http.StatusBadRequest, "unknown method")
		return
	}
	if req.Penalty == "" {
		req.Penalty = "none"
	}
	if !validPenalties[req.Penalty] {
		writeError(w, http.StatusBadRequest, "unknown penalty")
		return
	}
	rec := models.SolveRecord{
		ID:        newID("s_"),
		CreatedAt: nowISO(),
		Scramble:  req.Scramble,
		State:     req.State,
		TimeMs:    req.TimeMs,
		Method:    req.Method,
		Penalty:   req.Penalty,
		MoveCount: req.MoveCount,
		TPS:       req.TPS,
	}
	if rec.TPS == nil && rec.MoveCount != nil && rec.TimeMs > 0 {
		tps := float64(*rec.MoveCount) / (float64(rec.TimeMs) / 1000)
		rec.TPS = &tps
	}
	if err := d.Store.InsertSolve(r.Context(), middleware.UserID(r), rec); err != nil {
		writeError(w, http.StatusInternalServerError, "could not save solve")
		return
	}
	writeJSON(w, http.StatusCreated, rec)
}

type patchSolveRequest struct {
	Penalty string `json:"penalty"`
}

// PatchSolve handles PATCH /api/solves/{id} (penalty changes).
func (d *Deps) PatchSolve(w http.ResponseWriter, r *http.Request) {
	var req patchSolveRequest
	if !readJSON(w, r, &req) {
		return
	}
	if !validPenalties[req.Penalty] {
		writeError(w, http.StatusBadRequest, "unknown penalty")
		return
	}
	err := d.Store.UpdateSolvePenalty(r.Context(), middleware.UserID(r), r.PathValue("id"), req.Penalty)
	if errors.Is(err, sqlite.ErrNotFound) {
		writeError(w, http.StatusNotFound, "solve not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not update solve")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// DeleteSolve handles DELETE /api/solves/{id}.
func (d *Deps) DeleteSolve(w http.ResponseWriter, r *http.Request) {
	err := d.Store.DeleteSolve(r.Context(), middleware.UserID(r), r.PathValue("id"))
	if errors.Is(err, sqlite.ErrNotFound) {
		writeError(w, http.StatusNotFound, "solve not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not delete solve")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// Stats handles GET /api/stats.
func (d *Deps) Stats(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserID(r)
	solves, err := d.Store.ListSolves(r.Context(), userID, 1000)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load solves")
		return
	}
	learned, err := d.Store.CountLearnedAlgorithms(r.Context(), userID, learnedThreshold)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load training progress")
		return
	}
	writeJSON(w, http.StatusOK, models.ProfileStats{
		TotalSolves:       len(solves),
		BestTimeMs:        averages.Best(solves),
		StreakDays:        averages.Streak(solves, time.Now()),
		AlgorithmsLearned: learned,
		Ao5:               averages.AoN(solves, 5),
		Ao12:              averages.AoN(solves, 12),
	})
}

// ListAlgorithms handles GET /api/algorithms (auth optional: anonymous gets
// the plain library).
func (d *Deps) ListAlgorithms(w http.ResponseWriter, r *http.Request) {
	algs, err := d.Store.ListAlgorithms(r.Context(), middleware.UserID(r))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not list algorithms")
		return
	}
	writeJSON(w, http.StatusOK, algs)
}

type algorithmProgressRequest struct {
	Favorite *bool    `json:"favorite,omitempty"`
	Mastery  *float64 `json:"mastery,omitempty"`
}

// UpdateAlgorithmProgress handles POST /api/algorithms/{id}/progress.
func (d *Deps) UpdateAlgorithmProgress(w http.ResponseWriter, r *http.Request) {
	var req algorithmProgressRequest
	if !readJSON(w, r, &req) {
		return
	}
	if req.Favorite == nil && req.Mastery == nil {
		writeError(w, http.StatusBadRequest, "nothing to update")
		return
	}
	if req.Mastery != nil && (*req.Mastery < 0 || *req.Mastery > 1) {
		writeError(w, http.StatusBadRequest, "mastery must be within [0,1]")
		return
	}
	err := d.Store.SetAlgorithmProgress(r.Context(), middleware.UserID(r), r.PathValue("id"), req.Favorite, req.Mastery)
	if errors.Is(err, sqlite.ErrNotFound) {
		writeError(w, http.StatusNotFound, "algorithm not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not update progress")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// Shelves handles GET /api/home/shelves — dashboard rows derived from the
// user's recent activity, with sensible content for brand-new accounts.
func (d *Deps) Shelves(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := middleware.UserID(r)
	solves, err := d.Store.ListSolves(ctx, userID, 12)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load solves")
		return
	}
	algs, err := d.Store.ListAlgorithms(ctx, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load algorithms")
		return
	}

	shelves := []models.Shelf{}

	// Continue Solving: recent sessions, or starter cards for empty accounts.
	solveItems := []models.ShelfCardItem{}
	for i, s := range solves {
		if i >= 3 {
			break
		}
		solveItems = append(solveItems, models.ShelfCardItem{
			ID:       "c_" + s.ID,
			Title:    s.Method + " session",
			Subtitle: fmt.Sprintf("%s · %s", formatMs(s.TimeMs), relativeDay(s.CreatedAt)),
			Kind:     "solve",
			Href:     "/app/solver",
		})
	}
	if len(solveItems) == 0 {
		solveItems = []models.ShelfCardItem{
			{ID: "c_first", Title: "First solve", Subtitle: "Scramble and go", Kind: "solve", Href: "/app/solver"},
			{ID: "c_learn", Title: "Learn the basics", Subtitle: "Beginner method guide", Kind: "guide", Href: "/app/guide"},
		}
	}
	shelves = append(shelves, models.Shelf{ID: "continue", Heading: "Continue Solving", Items: solveItems})

	// Suggested Algorithms: in-progress first (0 < mastery < learned), then
	// untouched library cases.
	suggested := []models.ShelfCardItem{}
	appendAlg := func(a models.Algorithm, subtitle string) {
		suggested = append(suggested, models.ShelfCardItem{
			ID:       "a_" + a.ID,
			Title:    a.Name,
			Subtitle: subtitle,
			Kind:     "algorithm",
			Href:     "/app/guide",
		})
	}
	for _, a := range algs {
		if len(suggested) >= 4 {
			break
		}
		if a.Mastery != nil && *a.Mastery > 0 && *a.Mastery < learnedThreshold {
			appendAlg(a, fmt.Sprintf("%s · %d%% mastery", a.Set, int(*a.Mastery*100)))
		}
	}
	for _, a := range algs {
		if len(suggested) >= 4 {
			break
		}
		if a.Mastery == nil {
			appendAlg(a, a.Set+" · not started")
		}
	}
	if len(suggested) > 0 {
		shelves = append(shelves, models.Shelf{ID: "suggested", Heading: "Suggested Algorithms", Items: suggested})
	}

	writeJSON(w, http.StatusOK, shelves)
}

func formatMs(ms int64) string {
	sec := float64(ms) / 1000
	if sec >= 60 {
		return fmt.Sprintf("%d:%05.2f", int(sec)/60, sec-float64(int(sec)/60*60))
	}
	return fmt.Sprintf("%.2fs", sec)
}

func relativeDay(iso string) string {
	t, err := time.Parse(time.RFC3339, iso)
	if err != nil {
		return ""
	}
	switch days := int(time.Since(t).Hours() / 24); {
	case days <= 0:
		return "today"
	case days == 1:
		return "yesterday"
	default:
		return fmt.Sprintf("%d days ago", days)
	}
}
