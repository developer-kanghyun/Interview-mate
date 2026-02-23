#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_ENV_FILE="$ROOT_DIR/apps/web/.env.local"
SERVER_ENV_FILE="$ROOT_DIR/server/.env"

echo "[preflight] Interview-mate 환경 점검 시작"

missing=0

if [[ ! -f "$WEB_ENV_FILE" ]]; then
  echo "[preflight][warn] 누락: apps/web/.env.local"
  echo "  - 예시 파일: apps/web/.env.local.example"
  missing=1
else
  echo "[preflight][ok] apps/web/.env.local"
fi

if [[ ! -f "$SERVER_ENV_FILE" ]]; then
  echo "[preflight][warn] 누락: server/.env"
  echo "  - 예시 파일: server/.env.example"
  missing=1
else
  echo "[preflight][ok] server/.env"
fi

if [[ "$missing" -eq 1 ]]; then
  echo "[preflight] 필수 환경 파일이 누락되었습니다."
  exit 1
fi

echo "[preflight] 환경 점검 통과"
