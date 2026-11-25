# cubr task runner — one command vocabulary for every client.
# Run `just` (or `just help`) to list commands.
# Commands whose fragment has not landed yet are stubs: they name the
# fragment that will implement them and exit non-zero (never a false pass).

set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

# List all available commands
default:
    @just --list

# List all available commands
help:
    @just --list

# --- F0.1: scaffold (implemented) ---

# Verify the repo scaffold is complete (F0.1 "Done when")
verify:
    python3 scripts/verify_scaffold.py

# Report which toolchains are installed or missing
doctor:
    python3 scripts/doctor.py

# Remove local build output
clean:
    rm -rf web/dist backend/bin shared/cube-core/bin
    find . -path ./.git -prune -o -type d -name __pycache__ -print -exec rm -rf {} + 2>/dev/null || true
    @echo "clean: done"

# --- Stubs: implemented by later fragments ---

# Regenerate Go/Kotlin/TypeScript clients from the OpenAPI spec (F0.3)
codegen:
    @echo "not implemented yet: codegen -> F0.3 (OpenAPI contract + generated clients)" >&2; exit 2

# Build backend, web and mobile (F0.2+)
build:
    @echo "not implemented yet: build -> F0.2 (backend), F0.5 (web), F0.10 (mobile)" >&2; exit 2

# Run all test suites incl. golden vectors (F0.2+)
test:
    @echo "not implemented yet: test -> F0.2 (backend), F1.x (golden vectors), F0.5/F0.10 (clients)" >&2; exit 2

# Lint Go, Kotlin and TypeScript (F0.4)
lint:
    @echo "not implemented yet: lint -> F0.4 (CI)" >&2; exit 2

# Format all sources (F0.4)
fmt:
    @echo "not implemented yet: fmt -> F0.4 (CI)" >&2; exit 2

# Scaffold verify plus every CI gate (F0.4)
check: verify
    @echo "not implemented yet: check -> F0.4 (CI gates beyond 'verify')" >&2; exit 2

# Run the Go API locally (F0.2)
dev-backend:
    @echo "not implemented yet: dev-backend -> F0.2 (Go backend skeleton)" >&2; exit 2

# Run the web client dev server (F0.5)
dev-web:
    @echo "not implemented yet: dev-web -> F0.5 (web scaffold)" >&2; exit 2

# Build/install the Android app (F0.10)
dev-android:
    @echo "not implemented yet: dev-android -> F0.10 (KMP app scaffold)" >&2; exit 2

# Start local Postgres + backend via Docker Compose (F0.2)
db-up:
    @echo "not implemented yet: db-up -> F0.2 (infra / Docker Compose)" >&2; exit 2

# Stop local Postgres + backend (F0.2)
db-down:
    @echo "not implemented yet: db-down -> F0.2 (infra / Docker Compose)" >&2; exit 2

# Regenerate cube-core golden vectors (F1.4)
golden:
    @echo "not implemented yet: golden -> F1.4 (scramble generator + golden vector export)" >&2; exit 2

# Run the scan-accuracy benchmark (F2.6)
bench-scan:
    @echo "not implemented yet: bench-scan -> F2.6 (scan accuracy benchmark)" >&2; exit 2
