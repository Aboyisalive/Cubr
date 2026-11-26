package waitlist

import (
	"context"
	"os"
	"testing"

	"cubr/backend/internal/db"
)

// Integration test against a real Postgres. Runs when TEST_DATABASE_URL is
// set (CI provides a postgres service; locally, point it at the compose db
// or any throwaway Postgres). Exercises the actual migration, the unique
// index on lower(email), and duplicate handling end to end.
func TestPostgresWaitlistIntegration(t *testing.T) {
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("TEST_DATABASE_URL not set")
	}
	ctx := context.Background()
	pool, err := db.Connect(ctx, url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	defer pool.Close()
	if err := db.Migrate(ctx, pool); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	if _, err := pool.Exec(ctx, `TRUNCATE waitlist`); err != nil {
		t.Fatalf("truncate: %v", err)
	}

	store := NewPostgresStore(pool)

	created, err := store.Add(ctx, "cuber@example.com")
	if err != nil || !created {
		t.Fatalf("first Add = %v, %v; want true, nil", created, err)
	}
	// Duplicate (already normalized by the handler in production).
	created, err = store.Add(ctx, "cuber@example.com")
	if err != nil || created {
		t.Fatalf("duplicate Add = %v, %v; want false, nil", created, err)
	}

	var count int
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM waitlist`).Scan(&count); err != nil {
		t.Fatalf("count: %v", err)
	}
	if count != 1 {
		t.Fatalf("rows = %d, want 1 (unique index on lower(email))", count)
	}

	// The index itself rejects a differently-cased raw insert.
	if _, err := pool.Exec(ctx, `INSERT INTO waitlist (email) VALUES ('CUBER@example.com')`); err == nil {
		t.Fatal("raw differently-cased insert succeeded; unique index on lower(email) missing")
	}
}
