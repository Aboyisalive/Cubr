package waitlist

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store persists waitlist emails.
type Store interface {
	// Add inserts the (normalized) email and reports whether it was new.
	// A duplicate is not an error: it returns (false, nil).
	Add(ctx context.Context, email string) (created bool, err error)
}

// PostgresStore is a Store backed by PostgreSQL via pgx.
type PostgresStore struct {
	pool *pgxpool.Pool
}

func NewPostgresStore(pool *pgxpool.Pool) *PostgresStore {
	return &PostgresStore{pool: pool}
}

func (s *PostgresStore) Add(ctx context.Context, email string) (bool, error) {
	var created bool
	// The unique index on lower(email) is the last line of defense; the app
	// already stores lowercased addresses.
	err := s.pool.QueryRow(ctx, `
		INSERT INTO waitlist (email) VALUES ($1)
		ON CONFLICT (lower(email)) DO NOTHING
		RETURNING true`, email).Scan(&created)
	if err != nil {
		// ON CONFLICT DO NOTHING returns no row for a duplicate.
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, fmt.Errorf("insert waitlist email: %w", err)
	}
	return created, nil
}
