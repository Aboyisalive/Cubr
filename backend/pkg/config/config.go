// Package config loads service configuration from the environment with
// development-friendly defaults.
package config

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

type Config struct {
	// Addr is the listen address of the API gateway (CUBR_ADDR).
	Addr string
	// SolverAddr is the listen address of the standalone solver service.
	SolverAddr string
	// DBPath is the SQLite file (CUBR_DB); parent directory is created.
	DBPath string
	// JWTSecret signs session tokens (CUBR_JWT_SECRET); generated and persisted
	// beside the DB when unset so sessions survive restarts.
	JWTSecret []byte
	// SessionTTL is how long a login lasts.
	SessionTTL time.Duration
	// CORSOrigin is the allowed browser origin (CUBR_CORS_ORIGIN).
	CORSOrigin string
	// SecureCookies marks session cookies Secure (CUBR_SECURE_COOKIES=1).
	SecureCookies bool
	// WorkerInterval is the pause between worker rollup passes.
	WorkerInterval time.Duration
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// Load builds the config, creating the data directory and JWT secret if needed.
func Load() (*Config, error) {
	dbPath := env("CUBR_DB", "data/cubr.db")
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return nil, fmt.Errorf("create data dir: %w", err)
	}

	secret := []byte(os.Getenv("CUBR_JWT_SECRET"))
	if len(secret) == 0 {
		var err error
		secret, err = loadOrCreateSecret(filepath.Join(filepath.Dir(dbPath), "jwt.secret"))
		if err != nil {
			return nil, err
		}
	}

	return &Config{
		Addr:           env("CUBR_ADDR", ":8080"),
		SolverAddr:     env("CUBR_SOLVER_ADDR", ":8090"),
		DBPath:         dbPath,
		JWTSecret:      secret,
		SessionTTL:     7 * 24 * time.Hour,
		CORSOrigin:     env("CUBR_CORS_ORIGIN", "http://localhost:5173"),
		SecureCookies:  os.Getenv("CUBR_SECURE_COOKIES") == "1",
		WorkerInterval: 15 * time.Minute,
	}, nil
}

func loadOrCreateSecret(path string) ([]byte, error) {
	if b, err := os.ReadFile(path); err == nil && len(b) >= 32 {
		return b, nil
	}
	var raw [32]byte
	if _, err := rand.Read(raw[:]); err != nil {
		return nil, err
	}
	secret := []byte(hex.EncodeToString(raw[:]))
	if err := os.WriteFile(path, secret, 0o600); err != nil {
		return nil, fmt.Errorf("persist jwt secret: %w", err)
	}
	return secret, nil
}
