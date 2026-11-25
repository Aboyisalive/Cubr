# android/ — mobile app

Kotlin Multiplatform + Compose Multiplatform app. Shared Kotlin (`commonMain`)
holds models, the generated Ktor API client, SQLDelight offline cache and view
models; platform code sits behind `expect/actual` (CameraX on Android,
AVFoundation on iOS, 3D renderer per F0.11/F0.12).

First fragment: **F0.10** (app scaffold with theme tokens and bottom bar).
Driven by the Kotlin mirror of cube-core (F1.5); 3D outcome decided by the
F0.11 Filament spike and F0.12 iOS feasibility note.

Nothing here yet — F0.1 is scaffold only.
