CREATE TABLE IF NOT EXISTS solves (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    scramble   TEXT NOT NULL,
    state      TEXT,
    time_ms    INTEGER NOT NULL,
    method     TEXT NOT NULL DEFAULT 'CFOP',
    penalty    TEXT NOT NULL DEFAULT 'none',
    move_count INTEGER,
    tps        REAL
);

CREATE INDEX IF NOT EXISTS idx_solves_user_created ON solves(user_id, created_at DESC);
