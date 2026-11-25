# infra/ — infrastructure

Docker Compose for local development (Postgres + backend), the backend's
distroless Dockerfile, and deployment configuration. Local services are
driven from the repo root: `just db-up` / `just db-down`.

First fragment: **F0.2** (Compose with Postgres + `/healthz`-serving
backend). Nothing here yet — F0.1 is scaffold only.
