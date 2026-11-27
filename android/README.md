# android/ — mobile app

Kotlin Multiplatform + Compose Multiplatform app. Shared Kotlin (`commonMain`)
holds models, the generated Ktor API client, SQLDelight offline cache and view
models; platform code sits behind `expect/actual` (CameraX on Android,
AVFoundation on iOS, 3D renderer per F0.11/F0.12).

## Layout (F0.10)

AGP 9 requires the KMP library split, so:

- `composeApp/` — KMP library (`com.android.kotlin.multiplatform.library`):
  all shared UI and logic in `commonMain`, a `desktop` JVM target for
  emulator-free compile/test/preview, iOS targets deferred to F0.12.
- `androidApp/` — thin `com.android.application` shell: `MainActivity`,
  manifest, launcher icons. It only hosts the shared `App()`.

Targets in this fragment: Android + desktop JVM. SQLDelight, the generated
API client (F0.3) and view models plug into `commonMain` in later fragments.

## Run

```sh
# from this folder (JDK 17+, Android SDK via ANDROID_HOME or local.properties)
./gradlew :androidApp:assembleDebug        # APK in androidApp/build/outputs/apk/debug/
./gradlew :composeApp:desktopTest          # token + shared-logic unit tests
./gradlew :composeApp:run                  # desktop preview of the same UI
just dev-android                           # from repo root (same assemble)
```

Bottom bar: Home, Learn, a raised central Scan action button, Timer and
Algorithms (placeholder pages until their roadmap items land). Theme tokens
mirror `web/src/styles/tokens.css` value-for-value
(`composeApp/src/commonMain/kotlin/com/cubr/app/theme/CubrTokens.kt`, unit
tested) with a system-following dark/light default and a Home-page toggle.
