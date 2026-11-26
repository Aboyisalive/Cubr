# backend/ — Go API server

Go, standard-library `net/http` with the Go 1.22+ router. PostgreSQL via `pgx`
+ `sqlc`, migrations with goose or Atlas (decided in F0.2/F0.6). Stateless,
JWT auth, `slog` structured logging, distroless Docker image with one static
binary, `/healthz` + readiness endpoints, rate limiting on public endpoints.

Server stubs are generated from the OpenAPI contract in `shared/api/` (F0.3) —
contract first, never hand-written clients. Solving is a pure function of cube
state (memoizable, p95 < 50 ms per spec section 6).

## F0.2: skeleton (landed)

```
cmd/api/            entrypoint: config, slog (JSON), graceful shutdown
internal/config/    env config: PORT, DATABASE_URL, LOG_LEVEL, SHUTDOWN_TIMEOUT
internal/httpapi/   routes + request-logging middleware
Dockerfile          multi-stage, distroless static, nonroot
```

Routes so far: `GET /healthz`, `GET /readyz` → `{"service":"cubr-api","status":"ok"}`.

## F0.6: waitlist (landed)

`POST /waitlist` (contract in `shared/api/openapi.yaml`, unchanged since F0.3):

- `internal/waitlist/`: email normalization (trim + lowercase) and
  validation, typed errors (`INVALID_EMAIL` 400, `INVALID_JSON` 400,
  `RATE_LIMITED` 429 with `Retry-After`, `INTERNAL_ERROR` 500 without
  internals, `SERVICE_UNAVAILABLE` 503 when no database is configured).
- Duplicate emails return the identical `200 {"status":"subscribed"}` as
  new signups — silent success.
- Per-IP in-process token-bucket rate limiting (`WAITLIST_RATE_PER_MINUTE`,
  default 10; `WAITLIST_RATE_BURST`, default 5). Redis only when measured
  (spec 5.2).
- Postgres via pgx pool; goose migrations embedded in `internal/db/`
  (`00001_waitlist.sql`: `waitlist` table + unique index on `lower(email)`),
  applied on startup when `DATABASE_URL` is set. Without it the server
  still boots and `/healthz` works anywhere.
- Integration test (`TestPostgresWaitlistIntegration`) runs the migration
  and duplicate/index behavior against a real Postgres when
  `TEST_DATABASE_URL` is set (CI provides one).
- Browser callers (F0.7): CORS middleware allows `CORS_ALLOWED_ORIGINS`
  (default the local Vite dev/preview origins) with preflight handling;
  non-browser clients are unaffected.

Run it:

```sh
just dev-backend          # go run, listens on :8080 (PORT env overrides)
just test                 # unit tests (config + handlers)
curl localhost:8080/healthz
```

## Next

- F0.3: OpenAPI contract v0 + generated stubs/clients (contract first). ✅
- F3.8: solve endpoint (contract already defined in F0.3).
