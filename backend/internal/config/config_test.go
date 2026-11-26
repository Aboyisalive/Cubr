package config

import (
	"errors"
	"log/slog"
	"testing"
	"time"
)

func env(values map[string]string) func(string) string {
	return func(key string) string { return values[key] }
}

func TestLoadDefaults(t *testing.T) {
	cfg, err := LoadFrom(env(nil))
	if err != nil {
		t.Fatalf("LoadFrom: %v", err)
	}
	if cfg.Port != 8080 {
		t.Errorf("Port = %d, want 8080", cfg.Port)
	}
	if cfg.Addr() != ":8080" {
		t.Errorf("Addr() = %q, want :8080", cfg.Addr())
	}
	if cfg.DatabaseURL != "" {
		t.Errorf("DatabaseURL = %q, want empty (optional until F0.6)", cfg.DatabaseURL)
	}
	if cfg.LogLevel != slog.LevelInfo {
		t.Errorf("LogLevel = %v, want info", cfg.LogLevel)
	}
	if cfg.ShutdownTimeout != 10*time.Second {
		t.Errorf("ShutdownTimeout = %v, want 10s", cfg.ShutdownTimeout)
	}
}

func TestLoadEnvOverrides(t *testing.T) {
	cfg, err := LoadFrom(env(map[string]string{
		"PORT":             "9090",
		"DATABASE_URL":     "postgres://cubr:cubr@localhost:5432/cubr",
		"LOG_LEVEL":        "debug",
		"SHUTDOWN_TIMEOUT": "3s",
	}))
	if err != nil {
		t.Fatalf("LoadFrom: %v", err)
	}
	if cfg.Port != 9090 || cfg.Addr() != ":9090" {
		t.Errorf("Port/Addr = %d/%q, want 9090/:9090", cfg.Port, cfg.Addr())
	}
	if cfg.DatabaseURL == "" {
		t.Error("DatabaseURL not picked up from env")
	}
	if cfg.LogLevel != slog.LevelDebug {
		t.Errorf("LogLevel = %v, want debug", cfg.LogLevel)
	}
	if cfg.ShutdownTimeout != 3*time.Second {
		t.Errorf("ShutdownTimeout = %v, want 3s", cfg.ShutdownTimeout)
	}
}

func TestLoadInvalidValues(t *testing.T) {
	cases := map[string]map[string]string{
		"port not a number": {"PORT": "http"},
		"port zero":         {"PORT": "0"},
		"port too large":    {"PORT": "70000"},
		"bad log level":     {"LOG_LEVEL": "verbose"},
		"bad timeout":       {"SHUTDOWN_TIMEOUT": "soon"},
		"negative timeout":  {"SHUTDOWN_TIMEOUT": "-1s"},
		"zero rate limit":   {"WAITLIST_RATE_PER_MINUTE": "0"},
		"bad burst":         {"WAITLIST_RATE_BURST": "many"},
	}
	for name, values := range cases {
		t.Run(name, func(t *testing.T) {
			_, err := LoadFrom(env(values))
			if !errors.Is(err, ErrInvalidConfig) {
				t.Fatalf("err = %v, want ErrInvalidConfig", err)
			}
		})
	}
}
