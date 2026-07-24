package handlers

import (
	"errors"
	"net/http"
	"net/mail"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/Aboyisalive/cubr/backend/internal/api/middleware"
	"github.com/Aboyisalive/cubr/backend/internal/db/sqlite"
	"github.com/Aboyisalive/cubr/backend/pkg/models"
)

type credentials struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName,omitempty"`
}

func (d *Deps) setSession(w http.ResponseWriter, userID string) error {
	token, err := d.JWT.Issue(userID)
	if err != nil {
		return err
	}
	http.SetCookie(w, &http.Cookie{
		Name:     middleware.SessionCookie,
		Value:    token,
		Path:     "/",
		MaxAge:   int(d.JWT.TTL() / time.Second),
		HttpOnly: true,
		Secure:   d.SecureCookies,
		SameSite: http.SameSiteLaxMode,
	})
	return nil
}

// Register handles POST /api/auth/register.
func (d *Deps) Register(w http.ResponseWriter, r *http.Request) {
	var c credentials
	if !readJSON(w, r, &c) {
		return
	}
	c.Email = strings.TrimSpace(strings.ToLower(c.Email))
	if _, err := mail.ParseAddress(c.Email); err != nil {
		writeError(w, http.StatusBadRequest, "invalid email address")
		return
	}
	if len(c.Password) < 8 {
		writeError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}
	if c.DisplayName == "" {
		c.DisplayName = strings.SplitN(c.Email, "@", 2)[0]
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(c.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "hashing failed")
		return
	}
	u := sqlite.UserRow{
		User:         models.User{ID: newID("u_"), Email: c.Email, DisplayName: c.DisplayName},
		PasswordHash: string(hash),
		CreatedAt:    time.Now(),
	}
	if err := d.Store.CreateUser(r.Context(), u); err != nil {
		if errors.Is(err, sqlite.ErrDuplicateEmail) {
			writeError(w, http.StatusConflict, "email already registered")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not create user")
		return
	}
	if err := d.setSession(w, u.ID); err != nil {
		writeError(w, http.StatusInternalServerError, "could not start session")
		return
	}
	writeJSON(w, http.StatusOK, u.User)
}

// Login handles POST /api/auth/login.
func (d *Deps) Login(w http.ResponseWriter, r *http.Request) {
	var c credentials
	if !readJSON(w, r, &c) {
		return
	}
	u, err := d.Store.UserByEmail(r.Context(), strings.TrimSpace(strings.ToLower(c.Email)))
	if err != nil {
		writeError(w, http.StatusUnauthorized, "unknown email or wrong password")
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(c.Password)) != nil {
		writeError(w, http.StatusUnauthorized, "unknown email or wrong password")
		return
	}
	if err := d.setSession(w, u.ID); err != nil {
		writeError(w, http.StatusInternalServerError, "could not start session")
		return
	}
	writeJSON(w, http.StatusOK, u.User)
}

// Session handles GET /api/auth/session (requires auth).
func (d *Deps) Session(w http.ResponseWriter, r *http.Request) {
	u, err := d.Store.UserByID(r.Context(), middleware.UserID(r))
	if err != nil {
		writeError(w, http.StatusUnauthorized, "session user no longer exists")
		return
	}
	writeJSON(w, http.StatusOK, u.User)
}

// Logout handles POST /api/auth/logout.
func (d *Deps) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     middleware.SessionCookie,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   d.SecureCookies,
		SameSite: http.SameSiteLaxMode,
	})
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}
