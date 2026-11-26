// Command api is the cubr backend server.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"cubr/backend/internal/config"
	"cubr/backend/internal/db"
	"cubr/backend/internal/httpapi"
	"cubr/backend/internal/waitlist"
)

func main() {
	if err := run(); err != nil {
		slog.Error("fatal", "error", err)
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: cfg.LogLevel}))
	slog.SetDefault(logger)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// Waitlist (F0.6): enabled when a database is configured. Without one,
	// the endpoint answers a typed 503 and /healthz keeps working anywhere.
	waitlistHandler := waitlist.NewHandler(nil, waitlist.NewRateLimiter(cfg.WaitlistRatePerMinute, cfg.WaitlistRateBurst), logger)
	if cfg.DatabaseURL != "" {
		pool, err := db.Connect(ctx, cfg.DatabaseURL)
		if err != nil {
			return err
		}
		defer pool.Close()
		if err := db.Migrate(ctx, pool); err != nil {
			return err
		}
		logger.Info("database ready, waitlist enabled")
		waitlistHandler = waitlist.NewHandler(waitlist.NewPostgresStore(pool), waitlist.NewRateLimiter(cfg.WaitlistRatePerMinute, cfg.WaitlistRateBurst), logger)
	} else {
		logger.Warn("DATABASE_URL not set: waitlist endpoint will return 503")
	}

	server := &http.Server{
		Addr:              cfg.Addr(),
		Handler:           httpapi.New(logger, httpapi.Options{Waitlist: waitlistHandler, CORSAllowedOrigins: cfg.CORSAllowedOrigins}),
		ReadHeaderTimeout: 5 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		logger.Info("listening", "addr", cfg.Addr())
		errCh <- server.ListenAndServe()
	}()

	select {
	case err := <-errCh:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	case <-ctx.Done():
		logger.Info("shutting down")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
		defer cancel()
		return server.Shutdown(shutdownCtx)
	}
}
