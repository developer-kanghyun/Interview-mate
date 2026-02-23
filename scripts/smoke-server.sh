#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
API_KEY="${2:-test-key}"

echo "[smoke] base_url=$BASE_URL"

echo "[smoke] health check"
curl -sS "$BASE_URL/health" | sed -n '1,5p'

echo
echo "[smoke] start interview session (backend)"
curl -sS -X POST "$BASE_URL/api/interview/sessions/start" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"job_role":"backend"}' | sed -n '1,20p'

echo
echo "[smoke] done"
