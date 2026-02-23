#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
API_KEY="${2:-test-key}"

echo "[smoke-guards] base_url=$BASE_URL"
echo "[smoke-guards] api_key_prefix=${API_KEY:0:4}****"

start_response="$(curl -sS -X POST "$BASE_URL/api/interview/sessions/start" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"job_role":"backend","interviewer_character":"jet"}')"

session_id="$(printf '%s' "$start_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(d?.data?.session_id??"")')"
if [[ -z "$session_id" ]]; then
  echo "[smoke-guards][error] session_id not found"
  printf '%s\n' "$start_response"
  exit 1
fi
echo "[smoke-guards] session_id=$session_id"

report_status="$(curl -sS -o /tmp/smoke_report_body.json -w "%{http_code}" \
  "$BASE_URL/api/interview/sessions/$session_id/report" \
  -H "X-API-Key: $API_KEY")"
if [[ "$report_status" != "400" ]]; then
  echo "[smoke-guards][error] expected report status 400, got $report_status"
  cat /tmp/smoke_report_body.json
  exit 1
fi
report_error_code="$(node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync("/tmp/smoke_report_body.json","utf8"));process.stdout.write(String(d?.error?.code??""))')"
if [[ "$report_error_code" != "INVALID_INPUT" ]]; then
  echo "[smoke-guards][error] expected report error code INVALID_INPUT, got $report_error_code"
  cat /tmp/smoke_report_body.json
  exit 1
fi

study_status="$(curl -sS -o /tmp/smoke_study_body.json -w "%{http_code}" \
  "$BASE_URL/api/interview/sessions/$session_id/study" \
  -H "X-API-Key: $API_KEY")"
if [[ "$study_status" != "400" ]]; then
  echo "[smoke-guards][error] expected study status 400, got $study_status"
  cat /tmp/smoke_study_body.json
  exit 1
fi
study_error_code="$(node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync("/tmp/smoke_study_body.json","utf8"));process.stdout.write(String(d?.error?.code??""))')"
if [[ "$study_error_code" != "INVALID_INPUT" ]]; then
  echo "[smoke-guards][error] expected study error code INVALID_INPUT, got $study_error_code"
  cat /tmp/smoke_study_body.json
  exit 1
fi

history_90_status="$(curl -sS -o /tmp/smoke_history_90_body.json -w "%{http_code}" \
  "$BASE_URL/api/interview/history?days=90" \
  -H "X-API-Key: $API_KEY")"
if [[ "$history_90_status" != "200" ]]; then
  echo "[smoke-guards][error] expected history days=90 status 200, got $history_90_status"
  cat /tmp/smoke_history_90_body.json
  exit 1
fi
history_90_requested_days="$(node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync("/tmp/smoke_history_90_body.json","utf8"));process.stdout.write(String(d?.data?.requested_days??""))')"
if [[ "$history_90_requested_days" != "90" ]]; then
  echo "[smoke-guards][error] expected requested_days 90, got $history_90_requested_days"
  cat /tmp/smoke_history_90_body.json
  exit 1
fi
history_90_item_end_reason="$(node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync("/tmp/smoke_history_90_body.json","utf8"));const items=d?.data?.items??[];if(items.length===0){process.stdout.write("empty")}else{const v=items[0]?.session_end_reason;process.stdout.write(v===undefined?"missing":"present")}' )"
if [[ "$history_90_item_end_reason" == "missing" ]]; then
  echo "[smoke-guards][error] expected session_end_reason field on history item"
  cat /tmp/smoke_history_90_body.json
  exit 1
fi

history_91_status="$(curl -sS -o /tmp/smoke_history_91_body.json -w "%{http_code}" \
  "$BASE_URL/api/interview/history?days=91" \
  -H "X-API-Key: $API_KEY")"
if [[ "$history_91_status" != "400" ]]; then
  echo "[smoke-guards][error] expected history days=91 status 400, got $history_91_status"
  cat /tmp/smoke_history_91_body.json
  exit 1
fi
history_91_error_code="$(node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync("/tmp/smoke_history_91_body.json","utf8"));process.stdout.write(String(d?.error?.code??""))')"
if [[ "$history_91_error_code" != "INVALID_INPUT" ]]; then
  echo "[smoke-guards][error] expected history days=91 error code INVALID_INPUT, got $history_91_error_code"
  cat /tmp/smoke_history_91_body.json
  exit 1
fi

echo "[smoke-guards] done"
