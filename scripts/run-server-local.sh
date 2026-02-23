#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/server"

if [[ -f "$SERVER_DIR/.env" ]]; then
  set -a
  source "$SERVER_DIR/.env"
  set +a
fi

if command -v /usr/libexec/java_home >/dev/null 2>&1; then
  if JAVA_21_HOME=$(/usr/libexec/java_home -v 21 2>/dev/null); then
    export JAVA_HOME="$JAVA_21_HOME"
    export PATH="$JAVA_HOME/bin:$PATH"
  fi
fi

if [[ -z "${OPENAI_API_KEY:-}" || "${OPENAI_API_KEY:-}" == "your-openai-api-key" ]]; then
  echo "[WARN] OPENAI_API_KEY가 비어있거나 placeholder입니다. 로컬 fallback 모드로 실행합니다."
  export OPENAI_API_KEY="local-no-key"
fi

export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-local}"

if [[ "$SPRING_PROFILES_ACTIVE" == "local" ]]; then
  unset SPRING_DATASOURCE_URL
  unset SPRING_DATASOURCE_USERNAME
  unset SPRING_DATASOURCE_PASSWORD
fi

echo "[INFO] 서버 시작 profile=$SPRING_PROFILES_ACTIVE"
cd "$SERVER_DIR"
exec ./gradlew bootRun
