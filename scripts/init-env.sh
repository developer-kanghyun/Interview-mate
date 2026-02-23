#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

copy_if_missing() {
  local source_file="$1"
  local target_file="$2"

  if [[ -f "$target_file" ]]; then
    echo "[init-env][skip] 이미 존재: ${target_file#$ROOT_DIR/}"
    return
  fi

  cp "$source_file" "$target_file"
  echo "[init-env][ok] 생성: ${target_file#$ROOT_DIR/}"
}

echo "[init-env] 환경 파일 생성 시작"
copy_if_missing "$ROOT_DIR/apps/web/.env.local.example" "$ROOT_DIR/apps/web/.env.local"
copy_if_missing "$ROOT_DIR/server/.env.example" "$ROOT_DIR/server/.env"
echo "[init-env] 완료"
