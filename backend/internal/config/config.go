// Package config loads backend configuration from the environment.
//
// F0.2 scope: the API must boot and serve /healthz with no database, so
// DATABASE_URL is optional for now. F0.6 (waitlist) is the first fragment
// that requires it.
package config

import (
	"errors"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"strings"
	"time"
)

// ErrInvalidConfig is wrapped by every error Load returns.
var ErrInvalidConfig = errors.New("invalid config")

// Config is the backend's runtime configuration.
type Config struct {
	Port            int
	DatabaseURL     string
	LogLevel        slog.Level
	ShutdownTimeout time.Duration
	// Waitlist rate limiting (F0.6): requests per minute per IP, plus burst.
	WaitlistRatePerMinute int
	WaitlistRateBurst     int
	// CORSAllowedOrigins lists browser origins allowed to call the API (F0.7).
	CORSAllowedOrigins []string
}

// Addr returns the listen address for the HTTP server.
func (c Config) Addr() string {
	return fmt.Sprintf(":%d", c.Port)
}

// Load reads configuration from the process environment, applying defaults.
func Load() (Config, error) {
	return LoadFrom(os.Getenv)
}

// LoadFrom is Load with an injectable environment lookup (for tests).
func LoadFrom(getenv func(string) string) (Config, error) {
	cfg := Config{
		Port:                  8080,
		DatabaseURL:           getenv("DATABASE_URL"),
		LogLevel:              slog.LevelInfo,
		ShutdownTimeout:       10 * time.Second,
		WaitlistRatePerMinute: 10,
		WaitlistRateBurst:     5,
		CORSAllowedOrigins:    []string{"http://localhost:5173", "http://localhost:4173"},
	}

	if raw := getenv("PORT"); raw != "" {
		port, err := strconv.Atoi(raw)
		if err != nil || port < 1 || port > 65535 {
			return Config{}, fmt.Errorf("%w: PORT %q is not a valid port (1-65535)", ErrInvalidConfig, raw)
		}
		cfg.Port = port
	}

	if raw := getenv("LOG_LEVEL"); raw != "" {
		var level slog.Level
		if err := level.UnmarshalText([]byte(raw)); err != nil {
			return Config{}, fmt.Errorf("%w: LOG_LEVEL %q: %v", ErrInvalidConfig, raw, err)
		}
		cfg.LogLevel = level
	}

	if raw := getenv("CORS_ALLOWED_ORIGINS"); raw != "" {
		var origins []string
		for _, part := range strings.Split(raw, ",") {
			if origin := strings.TrimSpace(part); origin != "" {
				origins = append(origins, origin)
			}
		}
		cfg.CORSAllowedOrigins = origins
	}

	for _, item := range []struct {
		env  string
		dest *int
	}{
		{"WAITLIST_RATE_PER_MINUTE", &cfg.WaitlistRatePerMinute},
		{"WAITLIST_RATE_BURST", &cfg.WaitlistRateBurst},
	} {
		if raw := getenv(item.env); raw != "" {
			value, err := strconv.Atoi(raw)
			if err != nil || value < 1 {
				return Config{}, fmt.Errorf("%w: %s %q is not a positive integer", ErrInvalidConfig, item.env, raw)
			}
			*item.dest = value
		}
	}

	if raw := getenv("SHUTDOWN_TIMEOUT"); raw != "" {
		timeout, err := time.ParseDuration(raw)
		if err != nil || timeout <= 0 {
			return Config{}, fmt.Errorf("%w: SHUTDOWN_TIMEOUT %q is not a positive duration", ErrInvalidConfig, raw)
		}
		cfg.ShutdownTimeout = timeout
	}

	return cfg, nil
}
