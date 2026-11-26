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
    bash scripts/codegen.sh

# Build what exists so far (backend since F0.2; web/mobile join later)
build:
    cd backend && go build -o bin/cubr-api ./cmd/api

# Run test suites that exist so far (backend since F0.2)
test:
    cd backend && go test ./...

# Lint what exists so far (backend since F0.2; full CI gates in F0.4)
lint:
    cd backend && go vet ./...

# Format what exists so far (backend since F0.2)
fmt:
    cd backend && gofmt -w .

# Scaffold verify plus every CI gate (F0.4)
check: verify
    @echo "not implemented yet: check -> F0.4 (CI gates beyond 'verify')" >&2; exit 2

# Run the Go API locally (F0.2)
dev-backend:
    cd backend && go run ./cmd/api

# Run the web client dev server (F0.5)
dev-web:
    @echo "not implemented yet: dev-web -> F0.5 (web scaffold)" >&2; exit 2

# Build/install the Android app (F0.10)
dev-android:
    @echo "not implemented yet: dev-android -> F0.10 (KMP app scaffold)" >&2; exit 2

# Start local Postgres + backend via Docker Compose (F0.2)
db-up:
    if command -v docker >/dev/null 2>&1; then docker compose -f infra/docker-compose.yml up --build -d; else podman compose -f infra/docker-compose.yml up --build -d; fi

# Stop local Postgres + backend (F0.2)
db-down:
    if command -v docker >/dev/null 2>&1; then docker compose -f infra/docker-compose.yml down; else podman compose -f infra/docker-compose.yml down; fi

# Regenerate cube-core golden vectors (F1.4)
golden:
    @echo "not implemented yet: golden -> F1.4 (scramble generator + golden vector export)" >&2; exit 2

# Run the scan-accuracy benchmark (F2.6)
bench-scan:
    @echo "not implemented yet: bench-scan -> F2.6 (scan accuracy benchmark)" >&2; exit 2
