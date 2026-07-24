// Package handlers implements the HTTP endpoints of the cubr API. Response
// shapes mirror shared/types/*.ts; see pkg/models.
package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"

	"github.com/Aboyisalive/cubr/backend/internal/auth/jwt"
	"github.com/Aboyisalive/cubr/backend/internal/db/sqlite"
)

// Deps carries the shared dependencies of all handlers.
type Deps struct {
	Store *sqlite.Store
	JWT   *jwt.Manager
	// SecureCookies marks the session cookie Secure (enable behind HTTPS).
	SecureCookies bool
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

type apiError struct {
	Message string `json:"message"`
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, apiError{Message: msg})
}

func readJSON(w http.ResponseWriter, r *http.Request, v any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(v); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body: "+err.Error())
		return false
	}
	return true
}

// newID returns a short random id with a type prefix ("u_", "s_", ...).
func newID(prefix string) string {
	var b [6]byte
	rand.Read(b[:])
	return prefix + hex.EncodeToString(b[:])
}

func nowISO() string {
	return time.Now().UTC().Format(time.RFC3339)
}
