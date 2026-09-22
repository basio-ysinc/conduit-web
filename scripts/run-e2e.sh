#!/usr/bin/env bash
# conduit-api を一時 DB で起動し、その API に向けてビルドした web に対して Playwright を回す。
# 引数に spec ファイル名(auth.spec.ts など)を渡すとそれだけ、無ければ e2e/enabled.txt に列挙されたファイルを回す。
# CONDUIT_API_DIR: conduit-api の checkout。省略時は orca-loop が渡す ORCA_LOOP_RELATED_API、それも無ければ ../conduit-api(CI では .deps/conduit-api)。
set -euo pipefail
cd "$(dirname "$0")/.."
FILES=("$@")
if [ ${#FILES[@]} -eq 0 ]; then
  while IFS= read -r line; do
    line="${line%%#*}"; line="$(echo "$line" | xargs || true)"
    [ -n "$line" ] && FILES+=("$line")
  done < e2e/enabled.txt
fi
if [ ${#FILES[@]} -eq 0 ]; then
  echo "no e2e specs enabled (e2e/enabled.txt is empty); nothing to run"
  exit 0
fi
API_DIR="${CONDUIT_API_DIR:-${ORCA_LOOP_RELATED_API:-../conduit-api}}"
[ -f "$API_DIR/package.json" ] || { echo "conduit-api not found at $API_DIR (set CONDUIT_API_DIR)"; exit 1; }
API_PORT="${API_PORT:-3200}"
TMP="$(mktemp -d)"; trap '{ kill "$API_PID" 2>/dev/null && wait "$API_PID" 2>/dev/null; } || true; rm -rf "$TMP"' EXIT
(cd "$API_DIR" && pnpm install --silent && pnpm build >/dev/null)
(cd "$API_DIR" && PORT="$API_PORT" DATABASE_PATH="$TMP/e2e.db" node dist/index.js >"$TMP/api.log" 2>&1) &
API_PID=$!
for _ in $(seq 1 50); do curl -sf "http://localhost:$API_PORT/api/health" >/dev/null && break; sleep 0.2; done
curl -sf "http://localhost:$API_PORT/api/health" >/dev/null || { echo "conduit-api did not start"; cat "$TMP/api.log"; exit 1; }
export VITE_API_URL="http://localhost:$API_PORT/api"
export API_BASE="$VITE_API_URL"
export TEST_MODE="${TEST_MODE:-fullstack}"
pnpm build >/dev/null
PATHS=()
for f in "${FILES[@]}"; do PATHS+=("e2e/$f"); done
pnpm exec playwright test "${PATHS[@]}"
