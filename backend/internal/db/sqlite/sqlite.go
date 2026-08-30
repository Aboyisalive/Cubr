// Package sqlite is the embedded data layer (modernc.org/sqlite, pure Go).
// Schema and queries stay portable ANSI SQL so the internal/db/postgres
// implementation can slot in behind the same store type later.
package sqlite

import (
	"context"
	"database/sql"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	_ "modernc.org/sqlite"

	"github.com/Aboyisalive/cubr/backend/pkg/models"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

var ErrNotFound = errors.New("db: not found")
var ErrDuplicateEmail = errors.New("db: email already registered")
var ErrDuplicateWaitlistEmail = errors.New("db: waitlist email already registered")

// Store wraps the SQLite handle with the app's queries.
type Store struct {
	db *sql.DB
}

// Open opens (creating if needed) the database at path and runs migrations.
func Open(path string) (*Store, error) {
	dsn := fmt.Sprintf("file:%s?_pragma=journal_mode(WAL)&_pragma=foreign_keys(ON)&_pragma=busy_timeout(5000)", path)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	s := &Store{db: db}
	if err := s.migrate(); err != nil {
		db.Close()
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error { return s.db.Close() }

func (s *Store) migrate() error {
	if _, err := s.db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)`); err != nil {
		return err
	}
	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return err
	}
	names := make([]string, 0, len(entries))
	for _, e := range entries {
		names = append(names, e.Name())
	}
	sort.Strings(names)
	for _, name := range names {
		var applied int
		if err := s.db.QueryRow(`SELECT COUNT(*) FROM schema_migrations WHERE name = ?`, name).Scan(&applied); err != nil {
			return err
		}
		if applied > 0 {
			continue
		}
		body, err := migrationsFS.ReadFile("migrations/" + name)
		if err != nil {
			return err
		}
		tx, err := s.db.Begin()
		if err != nil {
			return err
		}
		if _, err := tx.Exec(string(body)); err != nil {
			tx.Rollback()
			return fmt.Errorf("migration %s: %w", name, err)
		}
		if _, err := tx.Exec(`INSERT INTO schema_migrations (name) VALUES (?)`, name); err != nil {
			tx.Rollback()
			return err
		}
		if err := tx.Commit(); err != nil {
			return err
		}
	}
	return nil
}

// --- users -----------------------------------------------------------------

// UserRow is a stored user (password hash never leaves this package's callers
// except for verification).
type UserRow struct {
	models.User
	PasswordHash string
	CreatedAt    time.Time
}

func (s *Store) CreateUser(ctx context.Context, u UserRow) error {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO users (id, email, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`,
		u.ID, u.Email, u.DisplayName, u.PasswordHash, u.CreatedAt.UTC().Format(time.RFC3339))
	if err != nil && strings.Contains(err.Error(), "UNIQUE") {
		return ErrDuplicateEmail
	}
	return err
}

func (s *Store) userBy(ctx context.Context, where, arg string) (*UserRow, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT id, email, display_name, password_hash, created_at FROM users WHERE `+where, arg)
	var u UserRow
	var created string
	if err := row.Scan(&u.ID, &u.Email, &u.DisplayName, &u.PasswordHash, &created); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	u.CreatedAt, _ = time.Parse(time.RFC3339, created)
	return &u, nil
}

func (s *Store) UserByEmail(ctx context.Context, email string) (*UserRow, error) {
	return s.userBy(ctx, "email = ?", email)
}

func (s *Store) UserByID(ctx context.Context, id string) (*UserRow, error) {
	return s.userBy(ctx, "id = ?", id)
}

func (s *Store) ListUserIDs(ctx context.Context) ([]string, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id FROM users`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

// InsertWaitlistSignup stores a public waitlist signup and returns its position.
func (s *Store) InsertWaitlistSignup(ctx context.Context, signup models.WaitlistSignup, name, email, createdAt string) (models.WaitlistSignup, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return models.WaitlistSignup{}, err
	}
	defer tx.Rollback()
	if _, err = tx.ExecContext(ctx,
		`INSERT INTO waitlist (id, name, email, created_at) VALUES (?, ?, ?, ?)`,
		signup.ID, name, email, createdAt); err != nil {
		if strings.Contains(strings.ToUpper(err.Error()), "UNIQUE") {
			return models.WaitlistSignup{}, ErrDuplicateWaitlistEmail
		}
		return models.WaitlistSignup{}, err
	}
	if err = tx.QueryRowContext(ctx, `SELECT COUNT(*) FROM waitlist`).Scan(&signup.Position); err != nil {
		return models.WaitlistSignup{}, err
	}
	if err = tx.Commit(); err != nil {
		return models.WaitlistSignup{}, err
	}
	return signup, nil
}

func (s *Store) WaitlistSignupByEmail(ctx context.Context, email string) (models.WaitlistSignup, error) {
	var signup models.WaitlistSignup
	err := s.db.QueryRowContext(ctx,
		`SELECT id, (SELECT COUNT(*) FROM waitlist w2 WHERE w2.created_at < w.created_at OR
			(w2.created_at = w.created_at AND w2.id <= w.id)) AS position
		 FROM waitlist w WHERE email = ?`, email).
		Scan(&signup.ID, &signup.Position)
	if errors.Is(err, sql.ErrNoRows) {
		return models.WaitlistSignup{}, ErrNotFound
	}
	return signup, err
}

// --- solves ----------------------------------------------------------------

func (s *Store) InsertSolve(ctx context.Context, userID string, r models.SolveRecord) error {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO solves (id, user_id, created_at, scramble, state, time_ms, method, penalty, move_count, tps)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		r.ID, userID, r.CreatedAt, r.Scramble, nullStr(r.State), r.TimeMs, r.Method, r.Penalty,
		r.MoveCount, r.TPS)
	return err
}

// ListSolves returns the user's solves, newest first.
func (s *Store) ListSolves(ctx context.Context, userID string, limit int) ([]models.SolveRecord, error) {
	if limit <= 0 || limit > 1000 {
		limit = 100
	}
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, created_at, scramble, state, time_ms, method, penalty, move_count, tps
		 FROM solves WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.SolveRecord{}
	for rows.Next() {
		var r models.SolveRecord
		var state sql.NullString
		if err := rows.Scan(&r.ID, &r.CreatedAt, &r.Scramble, &state, &r.TimeMs, &r.Method,
			&r.Penalty, &r.MoveCount, &r.TPS); err != nil {
			return nil, err
		}
		r.State = state.String
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *Store) UpdateSolvePenalty(ctx context.Context, userID, solveID, penalty string) error {
	res, err := s.db.ExecContext(ctx,
		`UPDATE solves SET penalty = ? WHERE id = ? AND user_id = ?`, penalty, solveID, userID)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) DeleteSolve(ctx context.Context, userID, solveID string) error {
	res, err := s.db.ExecContext(ctx,
		`DELETE FROM solves WHERE id = ? AND user_id = ?`, solveID, userID)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

// --- algorithms ------------------------------------------------------------

func (s *Store) CountAlgorithms(ctx context.Context) (int, error) {
	var n int
	err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM algorithms`).Scan(&n)
	return n, err
}

func (s *Store) InsertAlgorithm(ctx context.Context, a models.Algorithm) error {
	var alts *string
	if len(a.Alternatives) > 0 {
		b, err := json.Marshal(a.Alternatives)
		if err != nil {
			return err
		}
		v := string(b)
		alts = &v
	}
	_, err := s.db.ExecContext(ctx,
		`INSERT OR IGNORE INTO algorithms (id, alg_set, name, moves, alternatives, grp) VALUES (?, ?, ?, ?, ?, ?)`,
		a.ID, a.Set, a.Name, a.Moves, alts, nullStr(a.Group))
	return err
}

// ListAlgorithms returns the library with the user's favorite/mastery overlay
// (userID may be empty for the anonymous library).
func (s *Store) ListAlgorithms(ctx context.Context, userID string) ([]models.Algorithm, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT a.id, a.alg_set, a.name, a.moves, a.alternatives, a.grp,
		        COALESCE(ua.favorite, 0), ua.mastery
		 FROM algorithms a
		 LEFT JOIN user_algorithms ua ON ua.algorithm_id = a.id AND ua.user_id = ?
		 ORDER BY a.alg_set, a.grp, a.name`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.Algorithm{}
	for rows.Next() {
		var a models.Algorithm
		var alts, grp sql.NullString
		var fav int
		if err := rows.Scan(&a.ID, &a.Set, &a.Name, &a.Moves, &alts, &grp, &fav, &a.Mastery); err != nil {
			return nil, err
		}
		a.Group = grp.String
		a.Favorite = fav != 0
		if alts.Valid {
			_ = json.Unmarshal([]byte(alts.String), &a.Alternatives)
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

// SetAlgorithmProgress upserts the user's overlay; nil fields keep prior values.
func (s *Store) SetAlgorithmProgress(ctx context.Context, userID, algID string, favorite *bool, mastery *float64) error {
	var exists int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM algorithms WHERE id = ?`, algID).Scan(&exists); err != nil {
		return err
	}
	if exists == 0 {
		return ErrNotFound
	}
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO user_algorithms (user_id, algorithm_id, favorite, mastery, updated_at)
		 VALUES (?, ?, COALESCE(?, 0), COALESCE(?, 0), ?)
		 ON CONFLICT (user_id, algorithm_id) DO UPDATE SET
		   favorite = COALESCE(?, user_algorithms.favorite),
		   mastery = COALESCE(?, user_algorithms.mastery),
		   updated_at = ?`,
		userID, algID, boolPtrInt(favorite), mastery, now, boolPtrInt(favorite), mastery, now)
	return err
}

// CountLearnedAlgorithms counts overlays with mastery at or above the threshold.
func (s *Store) CountLearnedAlgorithms(ctx context.Context, userID string, threshold float64) (int, error) {
	var n int
	err := s.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM user_algorithms WHERE user_id = ? AND mastery >= ?`, userID, threshold).Scan(&n)
	return n, err
}

// --- worker rollups --------------------------------------------------------

func (s *Store) UpsertUserStats(ctx context.Context, userID string, totalSolves int, bestTimeMs *int64, streakDays int) error {
	now := time.Now().UTC().Format(time.RFC3339)
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO user_stats (user_id, total_solves, best_time_ms, streak_days, updated_at)
		 VALUES (?, ?, ?, ?, ?)
		 ON CONFLICT (user_id) DO UPDATE SET
		   total_solves = ?, best_time_ms = ?, streak_days = ?, updated_at = ?`,
		userID, totalSolves, bestTimeMs, streakDays, now,
		totalSolves, bestTimeMs, streakDays, now)
	return err
}

// --- helpers ---------------------------------------------------------------

func nullStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func boolPtrInt(b *bool) *int {
	if b == nil {
		return nil
	}
	v := 0
	if *b {
		v = 1
	}
	return &v
}
