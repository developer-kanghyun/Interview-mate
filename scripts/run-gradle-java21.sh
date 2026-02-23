#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/server"

if command -v /usr/libexec/java_home >/dev/null 2>&1; then
  if JAVA_21_HOME=$(/usr/libexec/java_home -v 21 2>/dev/null); then
    export JAVA_HOME="$JAVA_21_HOME"
    export PATH="$JAVA_HOME/bin:$PATH"
  fi
fi

cd "$SERVER_DIR"
exec ./gradlew "$@"
