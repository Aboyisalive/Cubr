-- Aggregates refreshed by cmd/worker (leaderboards / heavy rollups); the live
-- /api/stats endpoint computes from solves directly.
CREATE TABLE IF NOT EXISTS user_stats (
    user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_solves INTEGER NOT NULL DEFAULT 0,
    best_time_ms INTEGER,
    streak_days  INTEGER NOT NULL DEFAULT 0,
    updated_at   TEXT NOT NULL
);
