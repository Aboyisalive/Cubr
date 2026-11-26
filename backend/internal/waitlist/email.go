// Package waitlist implements the POST /waitlist endpoint (F0.6).
package waitlist

import (
	"errors"
	"net/mail"
	"strings"
)

// ErrInvalidEmail is returned when an address fails validation.
var ErrInvalidEmail = errors.New("invalid email")

const maxEmailLength = 254 // RFC 5321 path limit

// NormalizeEmail trims and lowercases an address for storage.
func NormalizeEmail(raw string) string {
	return strings.ToLower(strings.TrimSpace(raw))
}

// ValidateEmail reports whether a normalized address is acceptable.
// It deliberately accepts any syntactically valid addr-spec with a dotted
// domain; deliverability is confirmed by the signup email itself, not here.
func ValidateEmail(email string) error {
	if email == "" || len(email) > maxEmailLength {
		return ErrInvalidEmail
	}
	parsed, err := mail.ParseAddress(email)
	if err != nil || parsed.Address != email {
		return ErrInvalidEmail
	}
	at := strings.LastIndex(email, "@")
	if at < 1 {
		return ErrInvalidEmail
	}
	domain := email[at+1:]
	if !strings.Contains(domain, ".") || strings.HasPrefix(domain, ".") || strings.HasSuffix(domain, ".") {
		return ErrInvalidEmail
	}
	return nil
}
