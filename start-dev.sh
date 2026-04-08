#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [ ! -x node_modules/.bin/vite ]; then
  echo "[start-dev] Installing dependencies..."
  corepack pnpm install
fi

echo "[start-dev] Starting dev server on http://localhost:8080"
exec corepack pnpm start
