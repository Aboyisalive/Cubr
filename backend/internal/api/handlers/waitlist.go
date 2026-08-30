package handlers

import (
	"errors"
	"net/http"
	"net/mail"
	"strings"

	"github.com/Aboyisalive/cubr/backend/internal/db/sqlite"
	"github.com/Aboyisalive/cubr/backend/pkg/models"
)

type waitlistSignupRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

// Waitlist handles POST /api/waitlist. It is intentionally public.
func (d *Deps) Waitlist(w http.ResponseWriter, r *http.Request) {
	var req waitlistSignupRequest
	if !readJSON(w, r, &req) {
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}
	if address, err := mail.ParseAddress(req.Email); err != nil || address.Address != req.Email {
		writeError(w, http.StatusBadRequest, "invalid email address")
		return
	}

	signup := models.WaitlistSignup{ID: newID("w_")}
	created, err := d.Store.InsertWaitlistSignup(r.Context(), signup, req.Name, req.Email, nowISO())
	if err != nil {
		if errors.Is(err, sqlite.ErrDuplicateWaitlistEmail) {
			existing, lookupErr := d.Store.WaitlistSignupByEmail(r.Context(), req.Email)
			if lookupErr != nil {
				writeError(w, http.StatusInternalServerError, "could not load existing signup")
				return
			}
			writeJSON(w, http.StatusOK, existing)
			return
		}
		writeError(w, http.StatusInternalServerError, "could not save waitlist signup")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}
