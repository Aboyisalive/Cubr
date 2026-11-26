# shared/api/ — OpenAPI contract

The single contract between the Go backend and both clients. Contract first:
any fragment touching the API updates `openapi.yaml` here and regenerates the
clients before server or client code is written.

## Contract v0 (F0.3, landed)

`openapi.yaml` (OpenAPI 3.0.3) defines:

- `GET /healthz`, `GET /readyz` → `HealthResponse`
- `POST /waitlist` → `WaitlistRequest`/`WaitlistResponse`; duplicate emails
  return the same `200` as new signups (silent success); typed
  `ErrorResponse` for `400`/`429`. (Endpoint implemented in F0.6.)
- `POST /solve` → `SolveRequest`/`SolveResponse` (endpoint implemented in
  F3.8).
- Schemas: `CubeState` (54-char `URFDLB` facelet string + `version`),
  `ScanResult` (state + 54 confidences + warnings), `SolveMethod`
  (`LBL`/`CFOP`), `Move` (Singmaster pattern), `SolveStep` (phase, name,
  moves, `explanationKey`, `affectedPieces`, `stateAfter`), `GuideStep`
  (SolveStep + display text, highlight targets, animation duration),
  `ErrorResponse` (stable `code`, display-safe `message`, flat string
  `details`).

One contract bug was caught by codegen and fixed in v0: free-form
`additionalProperties: true` error details generated an unserializable
`kotlin.Any`; details are now `additionalProperties: {type: string}` on
every client.

## Codegen — one command

```sh
just codegen        # scripts/codegen.sh
```

Regenerates and compiles all three outputs:

| Output | Tool | Location |
| --- | --- | --- |
| Go server stubs (models + std-http server interface) | `oapi-codegen` v2 (`oapi-codegen.yaml`) | `gen/go/` (module `cubr/shared/api/gen/go`) |
| TypeScript client (fetch SDK + types) | `@hey-api/openapi-ts` (`gen/typescript/openapi-ts.config.ts`) | `gen/typescript/` (`@cubr/api-client`, strict `tsc`) |
| Kotlin client (Ktor + kotlinx.serialization) | OpenAPI Generator 7.x (`library=jvm-ktor`) | `gen/kotlin/` (`com.cubr.api`) |

Prerequisites: Go + `oapi-codegen` (`go install
github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@latest`), Node/npm,
a JDK (set `JAVA_HOME`; `~/.local/cubr-toolchain/jdk21` is auto-detected),
Gradle, and the generator jar at
`~/.local/cubr-toolchain/openapi-generator-cli.jar` (override with
`OPENAPI_GENERATOR_JAR`).

`gen/` output is committed so clients can consume it without running
codegen; never edit it by hand — change `openapi.yaml` and rerun
`just codegen`. The Kotlin output targets JVM/Ktor for now; the KMP module
in F0.10 will consume or regenerate it for `commonMain`.
