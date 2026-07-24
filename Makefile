# cubr — developer entrypoints
# Backend services read config from CUBR_* env vars (see backend/pkg/config).

.PHONY: api solver worker web web-live test test-backend test-shared build

## Run the API gateway (auth + resources + solver) on :8080
api:
	cd backend && go run ./cmd/api

## Run the standalone solver service on :8090
solver:
	cd backend && go run ./cmd/solver

## Run the stats rollup worker
worker:
	cd backend && go run ./cmd/worker

## Run the web app against the in-memory mock API
web:
	cd web && npm run dev

## Run the web app against the live Go backend (start `make api` first)
web-live:
	cd web && VITE_USE_MOCK=false VITE_API_BASE=http://localhost:8080 npm run dev

## Build all backend binaries into backend/bin
build:
	cd backend && go build -o bin/ ./cmd/...

test: test-shared test-backend

test-shared:
	cd shared && go test ./...

test-backend:
	cd backend && go test ./...
