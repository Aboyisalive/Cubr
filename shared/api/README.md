# shared/api/ — OpenAPI contract

The single contract between the Go backend and both clients. Contract first:
any fragment touching the API updates the spec here and regenerates the
clients before server or client code is written.

Defines (v0, F0.3): health, waitlist, `CubeState`, `ScanResult`,
`SolveRequest` / `SolveResponse`, `SolveStep`, `GuideStep` — plus the
generated Go server stubs, Kotlin (Ktor + kotlinx.serialization) client and
TypeScript client. Regenerate everything with one command: `just codegen`.

First fragment: **F0.3**. Nothing here yet — F0.1 is scaffold only.
