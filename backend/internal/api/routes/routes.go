// Package routes wires handlers onto the HTTP mux. The API gateway mounts
// everything; the standalone solver service mounts only the solver subset.
package routes

import (
	"net/http"

	"github.com/Aboyisalive/cubr/backend/internal/api/handlers"
	"github.com/Aboyisalive/cubr/backend/internal/api/middleware"
)

// MountSolver adds the stateless solver endpoints (no auth, no DB).
func MountSolver(mux *http.ServeMux, d *handlers.Deps) {
	mux.HandleFunc("POST /api/solver/validate", d.Validate)
	mux.HandleFunc("POST /api/solver/solve", d.Solve)
	mux.HandleFunc("GET /api/solver/scramble", d.Scramble)
}

// New builds the full API gateway handler.
func New(d *handlers.Deps, corsOrigin string) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"ok":true}`))
	})

	MountSolver(mux, d)

	// Auth.
	mux.HandleFunc("POST /api/auth/register", d.Register)
	mux.HandleFunc("POST /api/auth/login", d.Login)
	mux.HandleFunc("POST /api/auth/logout", d.Logout)
	mux.Handle("GET /api/auth/session", middleware.RequireAuth(d.JWT, http.HandlerFunc(d.Session)))

	// Authenticated resources.
	auth := func(h http.HandlerFunc) http.Handler { return middleware.RequireAuth(d.JWT, h) }
	mux.Handle("GET /api/solves", auth(d.ListSolves))
	mux.Handle("POST /api/solves", auth(d.CreateSolve))
	mux.Handle("PATCH /api/solves/{id}", auth(d.PatchSolve))
	mux.Handle("DELETE /api/solves/{id}", auth(d.DeleteSolve))
	mux.Handle("GET /api/stats", auth(d.Stats))
	mux.Handle("GET /api/home/shelves", auth(d.Shelves))
	mux.Handle("POST /api/algorithms/{id}/progress", auth(d.UpdateAlgorithmProgress))

	// Library readable anonymously; overlay appears when a session exists.
	mux.Handle("GET /api/algorithms", middleware.OptionalAuth(d.JWT, http.HandlerFunc(d.ListAlgorithms)))

	return middleware.Logger(middleware.CORS(corsOrigin, mux))
}
