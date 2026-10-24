#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

DEFAULT_PROXY_URL="${TWEB_NETWORK_PROXY_URL:-${VITE_NETWORK_PROXY_URL:-http://127.0.0.1:20122}}"
DEFAULT_PROXY_ENABLED="${VITE_NETWORK_PROXY_ENABLED:-1}"

if [ ! -x node_modules/.bin/vite ]; then
  echo "[start-dev] Installing dependencies..."
  corepack pnpm install
fi

if [ -t 0 ] && [ -t 1 ]; then
  USE_PROXY=""
  while [ -z "$USE_PROXY" ]; do
    if [ "$DEFAULT_PROXY_ENABLED" = "0" ]; then
      read -r -p "[start-dev] Use network proxy? [y/N] " USE_PROXY_ANSWER
    else
      read -r -p "[start-dev] Use network proxy? [Y/n] " USE_PROXY_ANSWER
    fi

    USE_PROXY_ANSWER="$(printf '%s' "$USE_PROXY_ANSWER" | tr '[:upper:]' '[:lower:]')"

    case "$USE_PROXY_ANSWER" in
      "" )
        if [ "$DEFAULT_PROXY_ENABLED" = "0" ]; then
          USE_PROXY="0"
        else
          USE_PROXY="1"
        fi
        ;;
      y|yes )
        USE_PROXY="1"
        ;;
      n|no )
        USE_PROXY="0"
        ;;
      * )
        echo "[start-dev] Please answer yes or no."
        ;;
    esac
  done

  if [ "$USE_PROXY" = "1" ]; then
    read -r -p "[start-dev] Proxy URL [${DEFAULT_PROXY_URL}] " PROXY_URL_ANSWER
    PROXY_URL="${PROXY_URL_ANSWER:-$DEFAULT_PROXY_URL}"
    export VITE_NETWORK_PROXY_ENABLED=1
    export VITE_NETWORK_PROXY_URL="$PROXY_URL"
    export TWEB_NETWORK_PROXY_URL="$PROXY_URL"
  else
    export VITE_NETWORK_PROXY_ENABLED=0
    export VITE_NETWORK_PROXY_URL=""
    export TWEB_NETWORK_PROXY_URL=""
  fi
fi

echo "[start-dev] Starting dev server on http://localhost:8080"

# 后台启动服务器
TWEB_SKIP_PROXY_PROMPT=1 corepack pnpm start &
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
