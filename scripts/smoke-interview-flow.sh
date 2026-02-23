#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
API_KEY="${2:-test-key}"
INTERVIEWER_CHARACTER="${3:-jet}"

echo "[smoke-flow] base_url=$BASE_URL"
echo "[smoke-flow] api_key_prefix=${API_KEY:0:4}****"
echo "[smoke-flow] interviewer_character=$INTERVIEWER_CHARACTER"

start_response="$(curl -sS -X POST "$BASE_URL/api/interview/sessions/start" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"job_role\":\"backend\",\"interviewer_character\":\"$INTERVIEWER_CHARACTER\"}")"

echo "[smoke-flow] start_session response received"

session_id="$(printf '%s' "$start_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(d?.data?.session_id??"")')"
question_id="$(printf '%s' "$start_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(d?.data?.first_question?.question_id??"")')"

if [[ -z "$session_id" || -z "$question_id" ]]; then
  echo "[smoke-flow][error] session_id or question_id not found"
  printf '%s\n' "$start_response"
  exit 1
fi

echo "[smoke-flow] session_id=$session_id question_id=$question_id"

answer_payload="$(cat <<JSON
{
  "question_id": $question_id,
  "answer_text": "REST API는 리소스를 URI로 식별하고 HTTP 메서드(GET, POST, PUT, DELETE)로 행위를 표현합니다. 상태코드는 2xx, 4xx, 5xx처럼 결과를 표준적으로 전달해 클라이언트-서버 계약을 명확히 합니다. 따라서 리소스 중심 설계와 일관된 상태코드 정책을 함께 유지하는 것이 중요합니다.",
  "input_type": "text"
}
JSON
)"

answer_response="$(curl -sS -X POST "$BASE_URL/api/interview/sessions/$session_id/answers" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$answer_payload")"

echo "[smoke-flow] submit_answer response received"

answer_success="$(printf '%s' "$answer_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(Boolean(d?.success)))')"
interviewer_emotion="$(printf '%s' "$answer_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(d?.data?.interviewer_emotion??""))')"
coaching_message="$(printf '%s' "$answer_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(d?.data?.coaching_message??""))')"
followup_remaining="$(printf '%s' "$answer_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(d?.data?.evaluation?.followup_remaining??""))')"
if [[ "$answer_success" != "true" ]]; then
  echo "[smoke-flow][error] answer submit failed"
  printf '%s\n' "$answer_response"
  exit 1
fi
if [[ -z "$interviewer_emotion" ]]; then
  echo "[smoke-flow][error] interviewer_emotion not found"
  printf '%s\n' "$answer_response"
  exit 1
fi
if [[ -z "$coaching_message" ]]; then
  echo "[smoke-flow][error] coaching_message not found"
  printf '%s\n' "$answer_response"
  exit 1
fi
if [[ -z "$followup_remaining" ]]; then
  echo "[smoke-flow][error] evaluation.followup_remaining not found"
  printf '%s\n' "$answer_response"
  exit 1
fi
echo "[smoke-flow] interviewer_emotion=$interviewer_emotion"

state_response="$(curl -sS -X GET "$BASE_URL/api/interview/sessions/$session_id" \
  -H "X-API-Key: $API_KEY")"

completion_rate="$(printf '%s' "$state_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(d?.data?.completion_rate??""))')"
answered_questions="$(printf '%s' "$state_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(d?.data?.answered_questions??""))')"
state_end_reason="$(printf '%s' "$state_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));const v=d?.data?.end_reason;process.stdout.write(v===undefined?"":String(v))')"

echo "[smoke-flow] state answered_questions=$answered_questions completion_rate=$completion_rate end_reason=${state_end_reason:-null}"

timeline_response="$(curl -sS -X GET "$BASE_URL/api/interview/sessions/$session_id/timeline" \
  -H "X-API-Key: $API_KEY")"
timeline_item_count="$(printf '%s' "$timeline_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(d?.data?.items?.length??0))')"
if [[ "$timeline_item_count" -lt 1 ]]; then
  echo "[smoke-flow][error] timeline item count is zero"
  printf '%s\n' "$timeline_response"
  exit 1
fi
echo "[smoke-flow] timeline_item_count=$timeline_item_count"
echo "[smoke-flow] done"
