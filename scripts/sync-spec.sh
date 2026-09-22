#!/usr/bin/env bash
# conduit-spec から E2E テストとテーマを取り込む。SPEC_DIR で場所を指定(既定 ../conduit-spec)。
set -euo pipefail
cd "$(dirname "$0")/.."
SPEC_DIR="${SPEC_DIR:-../conduit-spec}"
[ -d "$SPEC_DIR/e2e" ] || { echo "conduit-spec not found at $SPEC_DIR (set SPEC_DIR)"; exit 1; }
KEEP="$(mktemp)"; [ -f e2e/enabled.txt ] && cp e2e/enabled.txt "$KEEP"
rm -rf e2e; mkdir -p e2e
cp -R "$SPEC_DIR/e2e/." e2e/
[ -s "$KEEP" ] && cp "$KEEP" e2e/enabled.txt; rm -f "$KEEP"
cp "$SPEC_DIR/theme/styles.css" public/theme.css
cp "$SPEC_DIR/UPSTREAM.lock" e2e/UPSTREAM.lock
echo "synced spec from $SPEC_DIR"
