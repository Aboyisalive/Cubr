// cubr solver service: the stateless Phase 2 endpoints (validate, solve,
// scramble) as their own process, for deployments that split the gateway and
// solver per the architecture doc. The gateway also serves these in-process.
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
	"github.com/Aboyisalive/cubr/backend/internal/api/middleware"
	"github.com/Aboyisalive/cubr/backend/internal/api/routes"
	"github.com/Aboyisalive/cubr/backend/internal/solver/kociemba"
	"github.com/Aboyisalive/cubr/backend/pkg/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	go func() {
		start := time.Now()
		kociemba.InitTables()
		log.Printf("kociemba tables ready in %s", time.Since(start).Round(time.Millisecond))
	}()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"ok":true}`))
	})
	routes.MountSolver(mux, &handlers.Deps{})

	srv := &http.Server{
		Addr:              cfg.SolverAddr,
		Handler:           middleware.Logger(middleware.CORS(cfg.CORSOrigin, mux)),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("cubr solver listening on %s", cfg.SolverAddr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("serve: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}
