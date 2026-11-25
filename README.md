# cubr

A Rubik's Cube companion app for Android, iOS and the web: point your camera at
a scrambled cube, cubr reads it, shows it in 3D, solves it, and teaches you the
solution one step at a time.

**Core loop:** scan, see it in 3D, get a solution, learn it step by step.

> Status: **F0.1 — repo scaffold.** Every folder and command exists; nothing
> builds yet. See "Fragments" below for what lands when.

## Stack (fixed)

| Area | Choice |
| --- | --- |
| Mobile | Kotlin Multiplatform + Compose Multiplatform, SQLDelight (offline) |
| Web | TypeScript, React, Vite, Three.js, IndexedDB (offline) |
| Backend | Go (`net/http`), PostgreSQL via `pgx` + `sqlc`, OpenAPI contract |
| Cube logic | Go, canonical, in `shared/cube-core`; Kotlin and TypeScript mirrors verified against its golden vectors |
| Vision | Python / OpenCV / TFLite for tooling; scanning inference runs on-device |

No new dependencies or framework swaps without approval.

## Repo layout

| Path | What lives there | First fragment |
| --- | --- | --- |
| `android/` | KMP + Compose Multiplatform app (Android first, iOS via `expect/actual`) | F0.10 |
| `web/` | TypeScript / React / Vite web client | F0.5 |
| `backend/` | Go API server | F0.2 |
| `shared/cube-core/` | Canonical Go cube logic: facelet + cubie models, moves, validation, solvers, golden vectors | F1.1 |
| `shared/api/` | OpenAPI contract (single source of truth) and generated clients | F0.3 |
| `vision/` | Python/OpenCV dataset tooling, training, evaluation, scan benchmarks | F2.2 |
| `infra/` | Docker Compose (local Postgres + backend), Dockerfiles, deployment config | F0.2 |
| `scripts/` | Repo verification and maintenance scripts | F0.1 |

UI code is separate per client; the page map, design tokens and behavior are
shared. Cube logic is **not** duplicated by hand: the Kotlin and TypeScript
engines mirror the Go core and must pass its golden vectors in CI.

## Getting started

Prerequisites (install per fragment as it lands; F0.1 itself needs only
Python 3 and `just`):

- Python 3.11+ and [`just`](https://github.com/casey/just) — scaffold tooling
- Go 1.22+ — backend and cube-core (F0.2 / F1.1)
- Node.js 20+ and npm — web client (F0.5)
- JDK 17+ and Android SDK — mobile app (F0.10)
- Docker with Compose — local Postgres and backend (F0.2)

```sh
just            # list every available command
just doctor     # report which toolchains are installed / missing
just verify     # prove the scaffold is complete (F0.1 "Done when")
```

## Task runner

All repo commands go through the `justfile` at the repo root, so every client
shares one command vocabulary:

| Command | Does | Lands |
| --- | --- | --- |
| `just verify` | Scaffold structure check | F0.1 ✅ |
| `just doctor` | Toolchain presence report | F0.1 ✅ |
| `just codegen` | Regenerate Go / Kotlin / TypeScript clients from the OpenAPI spec | F0.3 |
| `just build` | Build backend, web and mobile | F0.2+ (per client) |
| `just test` | Run all test suites, incl. golden vectors | F0.2+ (per client) |
| `just lint` | Lint Go, Kotlin and TypeScript | F0.4 |
| `just fmt` | Format all sources | F0.4 |
| `just check` | `verify` plus every gate CI runs | F0.4 |
| `just dev-backend` | Run the Go API locally | F0.2 |
| `just dev-web` | Run the web client dev server | F0.5 |
| `just dev-android` | Build/install the Android app | F0.10 |
| `just db-up` / `just db-down` | Start/stop local Postgres + backend via Compose | F0.2 |
| `just golden` | Regenerate cube-core golden vectors | F1.4 |
| `just bench-scan` | Run the scan-accuracy benchmark | F2.6 |
| `just clean` | Remove local build output | F0.1 ✅ |

Commands for fragments that have not landed yet exist as stubs: they print the
fragment that will implement them and exit non-zero, so nothing ever reports a
false success.

## How work proceeds

One fragment at a time, in the order of section 9 of the product spec. Rules:

1. **Contract first.** Any fragment touching the API updates the OpenAPI spec
   in `shared/api/` and regenerates the clients before server or client code.
2. **Cube logic lives in Go** (`shared/cube-core`). Kotlin/TypeScript engines
   mirror it and must pass the golden vectors.
3. **Performance is a feature** (spec section 6): solve endpoints p95 < 50 ms,
   landing JS < 150 KB gzipped with 3D lazy-loaded, render loops kept out of
   React state, heavy work off the main thread.
4. A fragment is done only when its "Done when" criteria pass, proven by tests.
5. Small, reviewable commits, one fragment per commit.

## Fragments (current)

- **F0.1** Repo scaffold — this fragment.
- Next: **F0.2** Go backend skeleton (`net/http`, `slog`, `/healthz`,
  distroless Dockerfile, Docker Compose with Postgres).

Full fragment list: section 9 of the product spec.
