#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [ ! -x node_modules/.bin/vite ]; then
  echo "[start-dev] Installing dependencies..."
  corepack pnpm install
fi

echo "[start-dev] Starting dev server on http://localhost:8080"

# 后台启动服务器
corepack pnpm start &
SERVER_PID=$!

# 等待服务器就绪的函数（同原脚本）
wait_for_server() {
  local url=$1
  local max_attempts=30
  local attempt=1

  echo -n "[start-dev] Waiting for server to become ready"
  while [ $attempt -le $max_attempts ]; do
    if curl --output /dev/null --silent --head --fail "$url"; then
      echo " ready!"
      return 0
    fi
    echo -n "."
    sleep 1
    ((attempt++))
  done

  echo " timeout!"
  return 1
}

# 等待服务就绪
if wait_for_server "http://localhost:8080"; then
  if [ "$(uname)" = "Darwin" ]; then
    echo "[start-dev] Opening browser..."
    open "http://localhost:8080"
  fi
else
  echo "[start-dev] Server did not become ready in time. Exiting."
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

echo "[start-dev] Server is running (PID $SERVER_PID). Press Ctrl+C to stop."

# 捕获 SIGINT / SIGTERM，确保子进程被终止
cleanup() {
  echo "[start-dev] Stopping server..."
  kill $SERVER_PID 2>/dev/null || true
  wait $SERVER_PID 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

# 使用 wait 等待后台进程（无需 fg）
wait $SERVER_PID
