// Package jwt issues and verifies the HS256 session tokens carried in the
// cubr session cookie.
package jwt

import (
	"errors"
	"time"

	gojwt "github.com/golang-jwt/jwt/v5"
)

type Manager struct {
	secret []byte
	ttl    time.Duration
}

func New(secret []byte, ttl time.Duration) *Manager {
	return &Manager{secret: secret, ttl: ttl}
}

func (m *Manager) TTL() time.Duration { return m.ttl }

// Issue creates a signed token whose subject is the user id.
func (m *Manager) Issue(userID string) (string, error) {
	now := time.Now()
	claims := gojwt.RegisteredClaims{
		Subject:   userID,
		IssuedAt:  gojwt.NewNumericDate(now),
		ExpiresAt: gojwt.NewNumericDate(now.Add(m.ttl)),
		Issuer:    "cubr",
	}
	return gojwt.NewWithClaims(gojwt.SigningMethodHS256, claims).SignedString(m.secret)
}

var ErrInvalid = errors.New("jwt: invalid token")

// Verify parses a token and returns the user id.
func (m *Manager) Verify(token string) (string, error) {
	parsed, err := gojwt.ParseWithClaims(token, &gojwt.RegisteredClaims{},
		func(t *gojwt.Token) (any, error) { return m.secret, nil },
		gojwt.WithValidMethods([]string{"HS256"}), gojwt.WithIssuer("cubr"))
	if err != nil || !parsed.Valid {
		return "", ErrInvalid
	}
	claims, ok := parsed.Claims.(*gojwt.RegisteredClaims)
	if !ok || claims.Subject == "" {
		return "", ErrInvalid
	}
	return claims.Subject, nil
}
