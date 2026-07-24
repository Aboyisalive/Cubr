// cubr API gateway: auth, solves, stats, algorithms, dashboard shelves, and the
// solver endpoints served in-process.
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Aboyisalive/cubr/backend/internal/api/handlers"
	"github.com/Aboyisalive/cubr/backend/internal/api/routes"
	"github.com/Aboyisalive/cubr/backend/internal/auth/jwt"
	"github.com/Aboyisalive/cubr/backend/internal/db/seed"
	"github.com/Aboyisalive/cubr/backend/internal/db/sqlite"
	"github.com/Aboyisalive/cubr/backend/internal/solver/kociemba"
	"github.com/Aboyisalive/cubr/backend/pkg/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	store, err := sqlite.Open(cfg.DBPath)
	if err != nil {
		log.Fatalf("open db %s: %v", cfg.DBPath, err)
	}
	defer store.Close()

	if err := seed.Run(context.Background(), store); err != nil {
		log.Fatalf("seed algorithms: %v", err)
	}

	// Warm the two-phase tables (~3s) so the first solve request is instant.
	go func() {
		start := time.Now()
		kociemba.InitTables()
		log.Printf("kociemba tables ready in %s", time.Since(start).Round(time.Millisecond))
	}()

	deps := &handlers.Deps{
		Store:         store,
		JWT:           jwt.New(cfg.JWTSecret, cfg.SessionTTL),
		SecureCookies: cfg.SecureCookies,
	}
	srv := &http.Server{
		Addr:              cfg.Addr,
		Handler:           routes.New(deps, cfg.CORSOrigin),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("cubr api listening on %s (db %s, CORS %s)", cfg.Addr, cfg.DBPath, cfg.CORSOrigin)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("serve: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop
	log.Println("shutting down")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}
