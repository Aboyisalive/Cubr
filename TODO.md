# cubr — Phase 0 (rest) TODO

Session scope: F0.5–F0.8 (web), then F0.10–F0.12 (mobile and spikes).
One fragment at a time; stop after each for go. Contract first. No commits
unless explicitly told. F0.9 is blocked until the exported waitlist emails
are handed over.

Status: `[ ]` todo · `[~]` in progress · `[x]` done (only when its
"Done when" criteria pass, with tests) · `[!]` blocked

## Prerequisites (building first, per user decision 2026-11-26)

- [x] **F0.2 Go backend skeleton** — `net/http` server, config, `slog`,
  `/healthz`, distroless Dockerfile, Docker Compose with Postgres.
  Done when: `docker compose up` serves `/healthz`. ✅ verified 2026-11-26:
  `go test ./...` pass (config + handlers), binary serves `/healthz` and
  shuts down gracefully on SIGTERM, compose stack (Podman stand-in for
  Docker on this host) built and served `/healthz` on :8080 with Postgres
  ready. Caveat: container healthcheck `exec` is blocked by this host's
  crun/`oom_score_adj` sandbox limit, so the compose health-gate was
  verified via a throwaway override; the committed compose file keeps the
  standard `pg_isready` healthcheck for normal Docker hosts.
  - [x] Toolchains: Go + Node installed locally (Docker → Podman stand-in)
  - [x] `backend/` Go module: config (env) + `slog` + graceful shutdown
  - [x] `GET /healthz` (+ `/readyz`) handlers with tests
  - [x] Config unit tests (defaults, env override, invalid values)
  - [x] Distroless `backend/Dockerfile` (static binary)
  - [x] `infra/docker-compose.yml` (backend + Postgres, healthchecks)
  - [x] Wire `just` recipes (dev-backend, db-up/db-down, build/test/lint/fmt)
  - [x] Verify: `go test ./...`, server serves `/healthz` locally,
        container build + compose up serves `/healthz`
- [x] **F0.3 OpenAPI contract v0** — health, waitlist, `CubeState`,
  `ScanResult`, `SolveRequest`/`SolveResponse`, `SolveStep`, `GuideStep`
  + generated Go/Kotlin/TypeScript clients.
  Done when: codegen runs in one command, all three outputs compile.
  ✅ verified 2026-11-26: `just codegen` regenerated all three from
  scratch and each compiled (Go `go build`, TS strict `tsc`, Kotlin
  `gradle compileKotlin` with Ktor + kotlinx.serialization). Codegen
  caught a contract bug (unserializable free-form error `details`);
  fixed to flat string map in v0.
  - [x] Write `shared/api/openapi.yaml` (3.0.3, typed errors)
  - [x] Go server stubs via oapi-codegen → compile
  - [x] TypeScript client via @hey-api/openapi-ts → `tsc` compile
  - [x] Kotlin client (Ktor + kotlinx.serialization) → Gradle compile
  - [x] `just codegen` runs all three in one command
  - [x] Verify fresh regeneration compiles all three outputs
- [x] **F0.4 CI** — Go tests+lint, TS typecheck/lint/build, Kotlin build,
  web bundle-size check.
  Done when: a PR runs all checks green. ✅ verified locally 2026-11-26:
  every CI job's steps executed on this machine and passed (`just check`
  green, incl. bundle 10.7 KB gz / 150 KB; `npm ci` + lint/typecheck/build;
  `./gradlew compileKotlin`; gofmt/vet/test). Cannot literally open a PR
  (no commits/pushes without instruction) — first PR will exercise it.
  - [x] `.github/workflows/ci.yml`: scaffold / go / typescript / kotlin /
        codegen-freshness jobs
  - [x] TS lint wired (eslint; generated `src/` excluded, per codegen practice)
  - [x] `scripts/check-bundle-size.py` (150 KB gzip budget, web-first)
  - [x] `just check` mirrors every CI gate locally
  - [x] Verify: every CI step run locally, green; workflow YAML valid

## Fragments

- [x] **F0.5 Web scaffold** — Vite, React, strict TypeScript, Tailwind v4,
  shadcn/ui (Vite setup), `@` alias in vite config + tsconfig, `cn` in
  `lib/utils`, components in `components/ui`. Tokens (Primitives →
  Semantic/Light, Semantic/Dark) as CSS variables, self-hosted fonts,
  dark/light toggle respecting system preference.
  Done when: themed blank page toggles dark/light; lint, typecheck and
  build pass. ✅ verified 2026-11-26: eslint, strict typecheck, vitest
  (6 theme tests), production build all pass; `just check` green with the
  web bundle at 80.2 KB gz (< 150 KB); preview server serves the app.
  The toggle itself is browser-verified only by unit tests + the
  pre-paint inline script — no browser automation on this machine.
  - [x] Vite + React + strict TS scaffold in `web/` (`@` alias both configs)
  - [x] Tailwind v4 + shadcn/ui setup (`components.json`, `lib/utils` cn, Button)
  - [x] Token CSS: primitives → semantic light/dark as CSS variables
  - [x] Self-hosted fonts (Space Grotesk, Inter, JetBrains Mono) + fallbacks
  - [x] Theme provider: system preference, persisted, `.dark` class toggle
  - [x] Themed blank page (logo, toggle, token-driven surfaces)
  - [x] Tests: theme resolution unit tests (vitest)
  - [x] Wire `just` + CI web job; verify lint/typecheck/test/build
- [ ] **F0.6 Waitlist API** — OpenAPI contract first + regenerate clients,
  Postgres migration (unique index on lowercased email), Go handler, rate
  limit. Duplicate email = silent success; invalid email = typed error.
  Done when: tests cover new/duplicate/invalid email; generated TS client
  compiles.
- [ ] **F0.7 Landing page** — hero (Reference A layout + LiquidButton,
  Reference B shader background), copy placeholders as briefed, four-step
  core loop, feature highlights, final CTA, footer. One shared signup modal
  (inline validation, success state, keyboard + screen-reader support).
  Done when: signup works end to end against the local API, dark and light.
  After: web-design-guidelines audit, fix findings.
- [ ] **F0.8 Hero background** — raw WebGL2 (no Three.js), `uBlock`
  uniform, cube-face token colors via uniforms, 0.75 render scale with
  adaptive drop, DPR ≤ 1.5, `antialias: false`, paused off-screen/hidden,
  static frame under `prefers-reduced-motion`. WebP poster (< 40 KB,
  preloaded, is the LCP element); shader lazy-loads after first paint and
  fades in. Fallback image when WebGL2 unavailable.
  Done when: CTA interactive before shader loads; fallback shows without
  WebGL2; budgets met (JS < 150 KB gzip, LCP < 2.5 s, 60 fps → 30).
- [!] **F0.9 Waitlist import** — BLOCKED: waiting for the exported waitlist
  emails to be handed over. Done when: exported emails load with no
  duplicates.
- [ ] **F0.10 KMP app scaffold** — Compose Multiplatform, theme tokens
  matching web, bottom bar (Home, Learn, central Scan, Timer, Algorithms),
  placeholder pages only.
  Done when: app launches on Android with themed placeholders, dark + light.
- [ ] **F0.11 Filament spike (Android)** — rotating 26-cubie cube,
  cube-face colors.
  Done when: holds 60 fps on a mid-range device; measured fps, device and
  verdict recorded in `docs/filament-spike.md`. If it fails: stop and report
  before anything else.
- [ ] **F0.12 iOS 3D feasibility note** — Filament (C wrapper + cinterop)
  vs custom renderer under KMP.
  Done when: `docs/ios-3d-feasibility.md` contains a short recommendation.
  No app code.

## Blockers (found by repo check, 2026-11-26)

- **F0.2–F0.4 not present in this repo** — resolved: brief said F0.1–F0.4
  were done, but the tree held only F0.1. User decision: build F0.2→F0.4
  first, in order (see Prerequisites above).
- **Toolchains** — resolved locally: Go 1.27.4 and Node v26.13.1 installed
  under `~/.local/cubr-toolchain`. No Docker (no sudo); Podman is present
  and stands in for `docker compose up` verification.
- **Design sources:** logo received 2026-11-26 —
  `/home/col/Documents/Assets/logos/Cubr-logo.png` (8037×7983 RGBA;
  isometric cube, white top, orange star face, grey "CUBR" face, black
  background). Token *files* not handed over: derive token values from the
  spec (orange brand, neutrals, cube-face set, chrome ramp, status) in
  F0.5, structured Primitives → Semantic/Light + Semantic/Dark, so real
  token files can swap values in one place later. Do not invent a logo.
- **Skills:** installed 2026-11-26 (project level, `.agents/skills/`):
  `ux-designer` (szilu/ux-designer-skill), `canvas-design`
  (anthropics/skills), `design-taste-frontend` (Leonxlnx/taste-skill).
  User waived the other skills (`cubr-dual-theme`, `frontend-design`).

## Done

- [x] **F0.1 Repo scaffold** — monorepo, README, .gitignore, .editorconfig,
  `just` task runner. `just verify`: 55/55 checks pass. (Changes staged,
  uncommitted — commits only when explicitly told.)
