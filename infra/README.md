# infra/ — infrastructure

Docker Compose for local development (Postgres + backend), the backend's
distroless Dockerfile (in `backend/Dockerfile`), and deployment
configuration. Local services are driven from the repo root:

```sh
just db-up     # docker compose -f infra/docker-compose.yml up --build -d
curl localhost:8080/healthz
just db-down
```

`docker-compose.yml` (F0.2, landed): `db` (postgres:16-alpine, named volume,
`pg_isready` healthcheck) and `api` (built from `backend/Dockerfile`,
waits for a healthy db, `DATABASE_URL` wired to the `db` service). Ports and
credentials are overridable via `POSTGRES_*` / `API_PORT` env vars. The api
container has no in-container healthcheck — distroless has no shell or HTTP
client — so probe `/healthz` from the host.

Note: on hosts without Docker, `podman compose` runs the same file. Container
healthchecks need `exec` support in the runtime; where that is unavailable
(some sandboxes), start `db` first and probe from the host instead.
