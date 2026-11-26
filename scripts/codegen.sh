#!/usr/bin/env bash
# Regenerate all API clients from shared/api/openapi.yaml (F0.3).
# Usage: just codegen   (or scripts/codegen.sh)
# Requires: go + oapi-codegen, node + npm, java + openapi-generator-cli jar.
# Toolchain locations can be overridden with OAPI_CODEGEN / OPENAPI_GENERATOR_JAR.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API="$ROOT/shared/api"
GENERATOR_JAR="${OPENAPI_GENERATOR_JAR:-$HOME/.local/cubr-toolchain/openapi-generator-cli.jar}"

echo "==> Go server stubs (oapi-codegen)"
(cd "$API" && oapi-codegen -config oapi-codegen.yaml openapi.yaml)
(cd "$API/gen/go" && go mod tidy && go build ./...)

echo "==> TypeScript client (@hey-api/openapi-ts)"
cd "$API/gen/typescript"
[ -d node_modules ] || npm install
rm -rf src dist
npm run generate
npm run build

echo "==> Kotlin client (openapi-generator, Ktor + kotlinx.serialization)"
[ -f "$GENERATOR_JAR" ] || { echo "missing $GENERATOR_JAR (see shared/api/README.md)" >&2; exit 1; }
rm -rf "$API/gen/kotlin"
java -jar "$GENERATOR_JAR" generate \
  -i "$API/openapi.yaml" -g kotlin -o "$API/gen/kotlin" \
  --additional-properties library=jvm-ktor,serializationLibrary=kotlinx_serialization,apiPackage=com.cubr.api.apis,modelPackage=com.cubr.api.models,packageName=com.cubr.api,groupId=com.cubr,artifactId=cubr-api-client,artifactVersion=0.1.0 \
  >/dev/null
chmod +x "$API/gen/kotlin/gradlew" 2>/dev/null || true
if [ -d "$HOME/.local/cubr-toolchain/jdk21" ]; then
  export JAVA_HOME="${JAVA_HOME:-$HOME/.local/cubr-toolchain/jdk21}"
fi
(cd "$API/gen/kotlin" && gradle compileKotlin --no-daemon -q)
echo "codegen: all three clients generated and compiled"
