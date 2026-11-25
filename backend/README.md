# backend/ — Go API server

Go, standard-library `net/http` with the Go 1.22+ router. PostgreSQL via `pgx`
+ `sqlc`, migrations with goose or Atlas (decided in F0.2/F0.6). Stateless,
JWT auth, `slog` structured logging, distroless Docker image with one static
binary, `/healthz` + readiness endpoints, rate limiting on public endpoints.

Server stubs are generated from the OpenAPI contract in `shared/api/` (F0.3) —
contract first, never hand-written clients. Solving is a pure function of cube
state (memoizable, p95 < 50 ms per spec section 6).

First fragment: **F0.2** (server skeleton, config, `slog`, `/healthz`).

Nothing here yet — F0.1 is scaffold only.
