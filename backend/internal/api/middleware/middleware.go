// Package middleware provides CORS, request logging, and cookie-JWT auth.
package middleware

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/Aboyisalive/cubr/backend/internal/auth/jwt"
)

type ctxKey int

const userIDKey ctxKey = 0

// UserID returns the authenticated user id set by RequireAuth/OptionalAuth,
// or "" when the request is anonymous.
func UserID(r *http.Request) string {
	id, _ := r.Context().Value(userIDKey).(string)
	return id
}

// SessionCookie is the auth cookie name shared by handlers and middleware.
const SessionCookie = "cubr_session"

// CORS allows the web dev origin with credentials and answers preflights.
func CORS(origin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if o := r.Header.Get("Origin"); o != "" && o == origin {
			h := w.Header()
			h.Set("Access-Control-Allow-Origin", o)
			h.Set("Access-Control-Allow-Credentials", "true")
			h.Set("Vary", "Origin")
			if r.Method == http.MethodOptions {
				h.Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
				h.Set("Access-Control-Allow-Headers", "Content-Type")
				h.Set("Access-Control-Max-Age", "86400")
				w.WriteHeader(http.StatusNoContent)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

// Logger writes one line per request.
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(sw, r)
		log.Printf("%s %s -> %d (%s)", r.Method, r.URL.Path, sw.status, time.Since(start).Round(time.Millisecond))
	})
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func authenticate(m *jwt.Manager, r *http.Request) string {
	c, err := r.Cookie(SessionCookie)
	if err != nil || c.Value == "" {
		return ""
	}
	id, err := m.Verify(c.Value)
	if err != nil {
		return ""
	}
	return id
}

// RequireAuth rejects anonymous requests with 401.
func RequireAuth(m *jwt.Manager, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := authenticate(m, r)
		if id == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"message":"authentication required"}`))
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), userIDKey, id)))
	})
}

// OptionalAuth attaches the user when a valid session exists, else continues
// anonymously.
func OptionalAuth(m *jwt.Manager, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if id := authenticate(m, r); id != "" {
			r = r.WithContext(context.WithValue(r.Context(), userIDKey, id))
		}
		next.ServeHTTP(w, r)
	})
}
