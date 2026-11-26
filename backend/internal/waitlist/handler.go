package waitlist

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"math"
	"net"
	"net/http"
	"strconv"
)

const maxBodyBytes = 4 << 10 // 4 KB: an email address never needs more

// Handler serves POST /waitlist.
type Handler struct {
	store   Store
	limiter *RateLimiter
	logger  *slog.Logger
}

// NewHandler builds the waitlist handler. store may be nil when no database
// is configured; the endpoint then answers a typed 503.
func NewHandler(store Store, limiter *RateLimiter, logger *slog.Logger) *Handler {
	return &Handler{store: store, limiter: limiter, logger: logger}
}

type joinRequest struct {
	Email string `json:"email"`
}

type errorBody struct {
	Error struct {
		Code    string            `json:"code"`
		Message string            `json:"message"`
		Details map[string]string `json:"details,omitempty"`
	} `json:"error"`
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	var body errorBody
	body.Error.Code = code
	body.Error.Message = message
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if h.limiter != nil {
		allowed, retryAfter := h.limiter.Allow(clientIP(r))
		if !allowed {
			seconds := int(math.Ceil(retryAfter.Seconds()))
			if seconds < 1 {
				seconds = 1
			}
			w.Header().Set("Retry-After", strconv.Itoa(seconds))
			writeError(w, http.StatusTooManyRequests, "RATE_LIMITED", "Too many requests. Please try again shortly.")
			return
		}
	}

	if h.store == nil {
		writeError(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Waitlist is temporarily unavailable.")
		return
	}

	var req joinRequest
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBodyBytes))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			writeError(w, http.StatusRequestEntityTooLarge, "PAYLOAD_TOO_LARGE", "Request body is too large.")
			return
		}
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Request body must be a JSON object with an email field.")
		return
	}
	// Reject trailing content after the JSON object.
	if decoder.Decode(&struct{}{}) != io.EOF {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", "Request body must contain exactly one JSON object.")
		return
	}

	email := NormalizeEmail(req.Email)
	if err := ValidateEmail(email); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_EMAIL", "Please enter a valid email address.")
		return
	}

	created, err := h.store.Add(r.Context(), email)
	if err != nil {
		h.logger.Error("waitlist insert failed", "error", err)
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong. Please try again.")
		return
	}
	h.logger.Info("waitlist signup", "created", created)

	// New and duplicate emails get the identical response (silent success).
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "subscribed"})
}

// clientIP keys rate limiting by the direct peer only; forwarding headers
// are ignored until a trusted proxy is part of the deployment.
func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
