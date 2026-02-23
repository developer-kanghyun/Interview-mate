#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE_DIR="$(cd "$ROOT_DIR/.." && pwd)"
SERVER_LOG_FILE="$ROOT_DIR/.smoke-server.log"
SERVER_PID=""

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "[smoke-all-local] starting local server"
cd "$WORKSPACE_DIR"
npm run run:server >"$SERVER_LOG_FILE" 2>&1 &
SERVER_PID=$!

echo "[smoke-all-local] waiting for health endpoint"
for _ in $(seq 1 60); do
  if curl -fsS http://localhost:8080/health >/dev/null 2>&1; then
    echo "[smoke-all-local] server is ready"
    break
  fi

  if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    echo "[smoke-all-local][error] server failed to start"
    echo "--- server log ---"
    tail -n 200 "$SERVER_LOG_FILE" || true
    exit 1
  fi
  sleep 1
done

if ! curl -fsS http://localhost:8080/health >/dev/null 2>&1; then
  echo "[smoke-all-local][error] health check timeout"
  echo "--- server log ---"
  tail -n 200 "$SERVER_LOG_FILE" || true
  exit 1
fi

echo "[smoke-all-local] running smoke:all"
npm run smoke:all
echo "[smoke-all-local] done"
