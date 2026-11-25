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
`DATABASE_URL` is accepted but unused until F0.6; the server boots without a
database so `/healthz` works in any environment.

Run it:

```sh
just dev-backend          # go run, listens on :8080 (PORT env overrides)
just test                 # unit tests (config + handlers)
curl localhost:8080/healthz
```

## Next

- F0.3: OpenAPI contract v0 + generated stubs/clients (contract first).
- F0.6: waitlist endpoint, Postgres migration, rate limiting.
