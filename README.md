# cubr

Monorepo scaffold for a speedcubing app: Android (Kotlin/Compose), Web (React/Vite),
Go backend, shared Go/proto core, and a Python computer-vision pipeline.

## Layout

| Path        | Stack                                                        |
|-------------|-------------------------------------------------------------|
| `android/`  | Kotlin, Jetpack Compose, Hilt, Room, Retrofit, CameraX + TFLite |
| `web/`      | React, Vite, Tailwind, Three.js, TanStack Query, Zustand, PWA   |
| `backend/`  | Go (chi/fiber), GORM + pgx, Postgres + Redis, WebSocket         |
| `shared/`   | proto/OpenAPI contracts, Go `cube-core`, shared types/constants |
| `vision/`   | OpenCV + TensorFlow scanner, training, export (TFLite/TFJS), FastAPI |
| `docker/`   | Compose + per-service Dockerfiles                              |
| `migrations/` | Ordered SQL migrations                                       |
| `scripts/`  | Dev/seed/export helpers, protobuf generation                  |
| `ci/`       | GitHub Actions workflows per surface                          |

## Notes on naming

A few nodes in the source diagram were descriptive labels rather than file names.
They were materialized as concrete files:

- `camera/CameraX` → `CameraX.kt`, `camera/TFLiteRunner` → `TFLiteRunner.kt`
- `Room DB` → `RoomDatabase.kt`, `Retrofit client` → `RetrofitClient.kt`,
  `Hilt/DI` → `HiltModule.kt`, `Compose UI` → `ComposeUI.kt`, `Jetpack Nav` → `JetpackNav.kt`
- `AndroidManifest` → `AndroidManifest.xml`, `commitlint.config` → `commitlint.config.js`,
  `tailwind.config` → `tailwind.config.js`, `PWA manifest` → `web/manifest.webmanifest`
- web hooks/store/types/constants given concrete extensions (`.ts`)
- `pkg/ws/ (WebSocket)` → `pkg/ws/ws.go`; vision `server scan`/`fallback` → `server_scan.py`/`fallback.py`
- library labels (Three.js, IndexedDB, GORM + pgx, chi/fiber, etc.) belong in the
  respective manifests (`package.json`, `go.mod`, `requirements.txt`), not as files.

Empty directories carry a `.gitkeep` so the tree is preserved in git.
