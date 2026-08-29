CREATE TABLE IF NOT EXISTS waitlist (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at TEXT NOT NULL
);
