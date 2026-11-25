# shared/ — cross-client source of truth

| Path | Contents | First fragment |
| --- | --- | --- |
| `cube-core/` | Canonical Go cube logic + golden vectors | F1.1 |
| `api/` | OpenAPI contract and generated clients (Go, Kotlin, TypeScript) | F0.3 |

Anything that must never drift between clients lives here or is generated
from here. In particular: cube logic is implemented once in Go; the Kotlin
and TypeScript engines mirror it and must pass the same golden vectors in CI.
