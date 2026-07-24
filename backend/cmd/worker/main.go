// cubr worker: periodic analytics rollups. Recomputes per-user aggregate rows
// (user_stats) used for leaderboards and future heavy analytics, keeping the
// request path free of full-history scans.
package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Aboyisalive/cubr/backend/internal/db/sqlite"
	"github.com/Aboyisalive/cubr/backend/internal/stats/averages"
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

	log.Printf("cubr worker: rollups every %s (db %s)", cfg.WorkerInterval, cfg.DBPath)
	rollup(store)

	ticker := time.NewTicker(cfg.WorkerInterval)
	defer ticker.Stop()
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	for {
		select {
		case <-ticker.C:
			rollup(store)
		case <-stop:
			return
		}
	}
}

func rollup(store *sqlite.Store) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	ids, err := store.ListUserIDs(ctx)
	if err != nil {
		log.Printf("rollup: list users: %v", err)
		return
	}
	for _, id := range ids {
		solves, err := store.ListSolves(ctx, id, 1000)
		if err != nil {
			log.Printf("rollup %s: %v", id, err)
			continue
		}
		err = store.UpsertUserStats(ctx, id, len(solves), averages.Best(solves),
			averages.Streak(solves, time.Now()))
		if err != nil {
			log.Printf("rollup %s: %v", id, err)
		}
	}
	log.Printf("rollup: refreshed %d users", len(ids))
}
