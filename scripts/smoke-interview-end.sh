#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
API_KEY="${2:-test-key}"
INTERVIEWER_CHARACTER="${3:-jet}"

echo "[smoke-end] base_url=$BASE_URL"
echo "[smoke-end] api_key_prefix=${API_KEY:0:4}****"
echo "[smoke-end] interviewer_character=$INTERVIEWER_CHARACTER"

start_response="$(curl -sS -X POST "$BASE_URL/api/interview/sessions/start" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"job_role\":\"backend\",\"interviewer_character\":\"$INTERVIEWER_CHARACTER\"}")"

session_id="$(printf '%s' "$start_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(d?.data?.session_id??"")')"
if [[ -z "$session_id" ]]; then
  echo "[smoke-end][error] session_id not found"
  printf '%s\n' "$start_response"
  exit 1
fi

echo "[smoke-end] session_id=$session_id"

end_response="$(curl -sS -X POST "$BASE_URL/api/interview/sessions/$session_id/end" \
  -H "X-API-Key: $API_KEY")"

end_status="$(printf '%s' "$end_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(d?.data?.session_status??""))')"
end_reason="$(printf '%s' "$end_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(d?.data?.end_reason??""))')"
if [[ "$end_status" != "completed" ]]; then
  echo "[smoke-end][error] session_status is not completed"
  printf '%s\n' "$end_response"
  exit 1
fi
if [[ "$end_reason" != "user_end" ]]; then
  echo "[smoke-end][error] end_reason is not user_end"
  printf '%s\n' "$end_response"
  exit 1
fi

state_response="$(curl -sS -X GET "$BASE_URL/api/interview/sessions/$session_id" \
  -H "X-API-Key: $API_KEY")"
state_status="$(printf '%s' "$state_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(d?.data?.status??""))')"
state_end_reason="$(printf '%s' "$state_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(d?.data?.end_reason??""))')"
if [[ "$state_status" != "completed" ]]; then
  echo "[smoke-end][error] state status is not completed"
  printf '%s\n' "$state_response"
  exit 1
fi
if [[ "$state_end_reason" != "user_end" ]]; then
  echo "[smoke-end][error] state end_reason is not user_end"
  printf '%s\n' "$state_response"
  exit 1
fi

echo "[smoke-end] done"
