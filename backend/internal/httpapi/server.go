// Package httpapi builds the backend's HTTP handler.
//
// F0.2 scope: health and readiness only. API routes land contract-first in
// later fragments (waitlist in F0.6, solve in F3.8) from the OpenAPI spec
// in shared/api/.
package httpapi

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"
)

// Options carries optional route groups. Waitlist is the POST /waitlist
// handler (F0.6); when nil the route is not registered.
type Options struct {
	Waitlist http.Handler
}

// New returns the root HTTP handler with routes and middleware applied.
func New(logger *slog.Logger, opts Options) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", healthz)
	mux.HandleFunc("GET /readyz", healthz)
	if opts.Waitlist != nil {
		mux.Handle("POST /waitlist", opts.Waitlist)
	}
	return logRequests(logger, mux)
}

func healthz(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"service": "cubr-api",
	})
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func logRequests(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)
		logger.LogAttrs(r.Context(), slog.LevelDebug, "request",
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Int("status", rec.status),
			slog.Duration("duration", time.Since(start)),
		)
	})
}
