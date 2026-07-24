CREATE TABLE IF NOT EXISTS algorithms (
    id           TEXT PRIMARY KEY,
    alg_set      TEXT NOT NULL,
    name         TEXT NOT NULL,
    moves        TEXT NOT NULL,
    alternatives TEXT,
    grp          TEXT
);

CREATE TABLE IF NOT EXISTS user_algorithms (
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    algorithm_id TEXT NOT NULL REFERENCES algorithms(id) ON DELETE CASCADE,
    favorite     INTEGER NOT NULL DEFAULT 0,
    mastery      REAL NOT NULL DEFAULT 0,
    updated_at   TEXT NOT NULL,
    PRIMARY KEY (user_id, algorithm_id)
);
