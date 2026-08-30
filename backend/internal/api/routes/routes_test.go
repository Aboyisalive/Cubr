package routes_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
	"time"

	"github.com/Aboyisalive/cubr/backend/internal/api/handlers"
	"github.com/Aboyisalive/cubr/backend/internal/api/routes"
	"github.com/Aboyisalive/cubr/backend/internal/auth/jwt"
	"github.com/Aboyisalive/cubr/backend/internal/db/seed"
	"github.com/Aboyisalive/cubr/backend/internal/db/sqlite"
	"github.com/Aboyisalive/cubr/backend/pkg/models"
	cubecore "github.com/Aboyisalive/cubr/shared/cube-core"
)

type client struct {
	t       *testing.T
	handler http.Handler
	cookies []*http.Cookie
}

func newClient(t *testing.T) *client {
	t.Helper()
	store, err := sqlite.Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { store.Close() })
	if err := seed.Run(t.Context(), store); err != nil {
		t.Fatal(err)
	}
	deps := &handlers.Deps{
		Store: store,
		JWT:   jwt.New([]byte("test-secret-test-secret-test-secret"), time.Hour),
	}
	return &client{t: t, handler: routes.New(deps, "http://localhost:5173")}
}

func (c *client) do(method, path string, body any, out any) int {
	c.t.Helper()
	var buf bytes.Buffer
	if body != nil {
		json.NewEncoder(&buf).Encode(body)
	}
	req := httptest.NewRequest(method, path, &buf)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	for _, ck := range c.cookies {
		req.AddCookie(ck)
	}
	rec := httptest.NewRecorder()
	c.handler.ServeHTTP(rec, req)
	if cs := rec.Result().Cookies(); len(cs) > 0 {
		c.cookies = cs
	}
	if out != nil && rec.Code < 300 {
		if err := json.Unmarshal(rec.Body.Bytes(), out); err != nil {
			c.t.Fatalf("%s %s: bad JSON %q: %v", method, path, rec.Body.String(), err)
		}
	}
	return rec.Code
}

func TestAuthFlow(t *testing.T) {
	c := newClient(t)

	// Unauthenticated session probe fails.
	if code := c.do("GET", "/api/auth/session", nil, nil); code != http.StatusUnauthorized {
		t.Fatalf("session before login: got %d", code)
	}

	var u models.User
	code := c.do("POST", "/api/auth/register",
		map[string]string{"email": "max@example.com", "password": "hunter2hunter2"}, &u)
	if code != http.StatusOK || u.ID == "" || u.DisplayName != "max" {
		t.Fatalf("register: code %d user %+v", code, u)
	}

	// Cookie from register authenticates the session.
	var s models.User
	if code := c.do("GET", "/api/auth/session", nil, &s); code != http.StatusOK || s.ID != u.ID {
		t.Fatalf("session after register: code %d user %+v", code, s)
	}

	// Duplicate email rejected.
	if code := c.do("POST", "/api/auth/register",
		map[string]string{"email": "max@example.com", "password": "hunter2hunter2"}, nil); code != http.StatusConflict {
		t.Fatalf("duplicate register: got %d", code)
	}

	// Wrong password rejected; right password logs in.
	if code := c.do("POST", "/api/auth/login",
		map[string]string{"email": "max@example.com", "password": "wrong-password"}, nil); code != http.StatusUnauthorized {
		t.Fatalf("bad login: got %d", code)
	}
	if code := c.do("POST", "/api/auth/login",
		map[string]string{"email": "max@example.com", "password": "hunter2hunter2"}, &s); code != http.StatusOK {
		t.Fatalf("login: got %d", code)
	}

	// Logout clears the cookie.
	c.do("POST", "/api/auth/logout", nil, nil)
	if code := c.do("GET", "/api/auth/session", nil, nil); code != http.StatusUnauthorized {
		t.Fatalf("session after logout: got %d", code)
	}
}

func register(c *client) models.User {
	var u models.User
	if code := c.do("POST", "/api/auth/register",
		map[string]string{"email": "cuber@example.com", "password": "supersecret1"}, &u); code != http.StatusOK {
		c.t.Fatalf("register failed: %d", code)
	}
	return u
}

func TestSolvesAndStats(t *testing.T) {
	c := newClient(t)
	register(c)

	for i, ms := range []int64{12000, 11000, 15000, 9000, 13000} {
		body := map[string]any{"scramble": "R U R' U'", "timeMs": ms, "method": "CFOP"}
		if i == 2 {
			body["penalty"] = "plus2"
		}
		var rec models.SolveRecord
		if code := c.do("POST", "/api/solves", body, &rec); code != http.StatusCreated {
			t.Fatalf("create solve %d: %d", i, code)
		}
	}

	var solves []models.SolveRecord
	if code := c.do("GET", "/api/solves", nil, &solves); code != http.StatusOK || len(solves) != 5 {
		t.Fatalf("list solves: code %d n %d", code, len(solves))
	}

	var stats models.ProfileStats
	if code := c.do("GET", "/api/stats", nil, &stats); code != http.StatusOK {
		t.Fatalf("stats: %d", code)
	}
	if stats.TotalSolves != 5 || stats.BestTimeMs == nil || *stats.BestTimeMs != 9000 {
		t.Fatalf("stats wrong: %+v", stats)
	}
	if stats.Ao5 == nil || stats.Ao5.AverageMs == nil {
		t.Fatalf("ao5 missing: %+v", stats.Ao5)
	}
	// Ao5 window: times 12000, 11000, 15000+2000(plus2), 9000, 13000 → drop 9000
	// and 17000 → mean(12000, 11000, 13000) = 12000.
	if *stats.Ao5.AverageMs != 12000 {
		t.Fatalf("ao5: want 12000, got %d", *stats.Ao5.AverageMs)
	}
	if stats.StreakDays != 1 {
		t.Fatalf("streak: want 1, got %d", stats.StreakDays)
	}

	// Penalty patch + delete.
	if code := c.do("PATCH", "/api/solves/"+solves[0].ID, map[string]string{"penalty": "dnf"}, nil); code != http.StatusOK {
		t.Fatalf("patch: %d", code)
	}
	if code := c.do("DELETE", "/api/solves/"+solves[1].ID, nil, nil); code != http.StatusOK {
		t.Fatalf("delete: %d", code)
	}
	c.do("GET", "/api/solves", nil, &solves)
	if len(solves) != 4 {
		t.Fatalf("after delete: n %d", len(solves))
	}
}

func TestAlgorithmsAndShelves(t *testing.T) {
	c := newClient(t)

	// Anonymous library read works.
	var algs []models.Algorithm
	if code := c.do("GET", "/api/algorithms", nil, &algs); code != http.StatusOK || len(algs) < 30 {
		t.Fatalf("anonymous algorithms: code %d n %d", code, len(algs))
	}

	register(c)

	// Update progress and see the overlay.
	body := map[string]any{"favorite": true, "mastery": 0.9}
	if code := c.do("POST", "/api/algorithms/pll_t/progress", body, nil); code != http.StatusOK {
		t.Fatalf("progress: %d", code)
	}
	c.do("GET", "/api/algorithms", nil, &algs)
	found := false
	for _, a := range algs {
		if a.ID == "pll_t" {
			found = true
			if !a.Favorite || a.Mastery == nil || *a.Mastery != 0.9 {
				t.Fatalf("overlay missing: %+v", a)
			}
		}
	}
	if !found {
		t.Fatal("pll_t not in library")
	}

	// Learned algorithms feed stats.
	var stats models.ProfileStats
	c.do("GET", "/api/stats", nil, &stats)
	if stats.AlgorithmsLearned != 1 {
		t.Fatalf("algorithmsLearned: want 1, got %d", stats.AlgorithmsLearned)
	}

	// Shelves exist for a fresh account and mention suggestions.
	var shelves []models.Shelf
	if code := c.do("GET", "/api/home/shelves", nil, &shelves); code != http.StatusOK || len(shelves) == 0 {
		t.Fatalf("shelves: code %d n %d", code, len(shelves))
	}
}

func TestSolverEndpoints(t *testing.T) {
	c := newClient(t)

	// Scramble → validate → solve round trip (no auth required).
	var scr models.ScrambleResponse
	if code := c.do("GET", "/api/solver/scramble", nil, &scr); code != http.StatusOK {
		t.Fatalf("scramble: %d", code)
	}
	var vr cubecore.ValidationResult
	if code := c.do("POST", "/api/solver/validate", models.CubeStateRequest{Facelets: scr.State}, &vr); code != http.StatusOK || !vr.Valid {
		t.Fatalf("validate: code %d %+v", code, vr)
	}

	var sol models.SolveResponse
	if code := c.do("POST", "/api/solver/solve", models.CubeStateRequest{Facelets: scr.State}, &sol); code != http.StatusOK {
		t.Fatalf("solve: %d", code)
	}
	if sol.MoveCount == 0 || sol.Method != "kociemba" {
		t.Fatalf("solve response: %+v", sol)
	}
	// The returned solution must actually solve the scrambled state.
	cc, _ := cubecore.FaceletsToCubie(scr.State)
	moves, err := cubecore.ParseMoves(sol.Solution)
	if err != nil {
		t.Fatalf("unparseable solution %q: %v", sol.Solution, err)
	}
	if !cc.ApplyAll(moves).IsSolved() {
		t.Fatalf("solution %q does not solve %q", sol.Solution, scr.State)
	}

	// Beginner method returns stages.
	if code := c.do("POST", "/api/solver/solve",
		models.CubeStateRequest{Facelets: scr.State, Method: "beginner"}, &sol); code != http.StatusOK {
		t.Fatalf("beginner solve: %d", code)
	}
	if sol.Method != "beginner" || len(sol.Stages) == 0 {
		t.Fatalf("beginner response: %+v", sol)
	}

	var methods []cubecore.Method
	if code := c.do("GET", "/api/solver/methods", nil, &methods); code != http.StatusOK || len(methods) < 2 {
		t.Fatalf("methods: code %d n %d", code, len(methods))
	}

	// Invalid state is a 422 with validation errors.
	bad := models.CubeStateRequest{Facelets: "UUUUUUUUU"}
	if code := c.do("POST", "/api/solver/solve", bad, nil); code != http.StatusUnprocessableEntity {
		t.Fatalf("invalid solve: %d", code)
	}
}
