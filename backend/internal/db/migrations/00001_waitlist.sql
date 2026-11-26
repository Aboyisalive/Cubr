-- +goose Up
-- Waitlist signups. Emails are stored lowercased and trimmed by the app,
-- and the unique index on lower(email) enforces one row per address even
-- if a write path ever bypasses normalization.
CREATE TABLE waitlist (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email      TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX waitlist_email_lower_unique ON waitlist (lower(email));

-- +goose Down
DROP TABLE IF EXISTS waitlist;
