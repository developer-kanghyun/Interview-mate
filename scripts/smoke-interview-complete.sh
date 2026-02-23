#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
API_KEY="${2:-test-key}"
INTERVIEWER_CHARACTER="${3:-jet}"
MAX_STEPS="${4:-14}"

echo "[smoke-complete] base_url=$BASE_URL"
echo "[smoke-complete] api_key_prefix=${API_KEY:0:4}****"
echo "[smoke-complete] interviewer_character=$INTERVIEWER_CHARACTER"

start_response="$(curl -sS -X POST "$BASE_URL/api/interview/sessions/start" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"job_role\":\"backend\",\"interviewer_character\":\"$INTERVIEWER_CHARACTER\"}")"

session_id="$(printf '%s' "$start_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(d?.data?.session_id??"")')"
question_id="$(printf '%s' "$start_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(d?.data?.first_question?.question_id??"")')"

if [[ -z "$session_id" || -z "$question_id" ]]; then
  echo "[smoke-complete][error] session_id or first question_id not found"
  printf '%s\n' "$start_response"
  exit 1
fi

echo "[smoke-complete] session_id=$session_id first_question_id=$question_id"

completed="false"
for ((step=1; step<=MAX_STEPS; step++)); do
  answer_payload="$(cat <<JSON
{
  "question_id": $question_id,
  "answer_text": "핵심 개념을 먼저 정의하고, 근거와 예시를 붙여 설명하겠습니다. 이 답변은 구조적으로 결론-근거-예시 순서를 유지하며 트레이드오프를 포함해 설명합니다. 실무에서는 요구사항과 제약조건에 따라 선택 기준을 분명히 두고 검증 지표를 함께 설계합니다.",
  "input_type": "text"
}
JSON
)"

  answer_response="$(curl -sS -X POST "$BASE_URL/api/interview/sessions/$session_id/answers" \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$answer_payload")"

  answer_success="$(printf '%s' "$answer_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(Boolean(d?.success)))')"
  if [[ "$answer_success" != "true" ]]; then
    echo "[smoke-complete][error] answer submit failed at step=$step"
    printf '%s\n' "$answer_response"
    exit 1
  fi

  session_status="$(printf '%s' "$answer_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(d?.data?.session_status??""))')"
  end_reason="$(printf '%s' "$answer_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));const v=d?.data?.end_reason;process.stdout.write(v===undefined?"":String(v))')"
  coaching_message="$(printf '%s' "$answer_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(d?.data?.coaching_message??""))')"
  next_question_id="$(printf '%s' "$answer_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));const v=d?.data?.next_question?.question_id;process.stdout.write(v===undefined||v===null?"":String(v))')"
  followup_question="$(printf '%s' "$answer_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));const v=d?.data?.followup_question;process.stdout.write(v===undefined||v===null?"":String(v))')"

  if [[ -z "$coaching_message" ]]; then
    echo "[smoke-complete][error] coaching_message not found at step=$step"
    printf '%s\n' "$answer_response"
    exit 1
  fi

  echo "[smoke-complete] step=$step status=$session_status end_reason=${end_reason:-null} next_question_id=${next_question_id:-none}"

  if [[ "$session_status" == "completed" ]]; then
    if [[ "$end_reason" != "completed_all_questions" ]]; then
      echo "[smoke-complete][error] expected end_reason=completed_all_questions on completion"
      printf '%s\n' "$answer_response"
      exit 1
    fi
    completed="true"
    break
  fi

  if [[ -n "$next_question_id" ]]; then
    question_id="$next_question_id"
    continue
  fi

  if [[ -n "$followup_question" ]]; then
    # follow-up는 같은 question_id를 유지한다.
    continue
  fi

  echo "[smoke-complete][error] neither next_question nor followup returned while session is in_progress"
  printf '%s\n' "$answer_response"
  exit 1
done

if [[ "$completed" != "true" ]]; then
  echo "[smoke-complete][error] session was not completed within max steps=$MAX_STEPS"
  exit 1
fi

report_response="$(curl -sS -X GET "$BASE_URL/api/interview/sessions/$session_id/report" \
  -H "X-API-Key: $API_KEY")"
report_status="$(printf '%s' "$report_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(d?.data?.session_status??""))')"
report_end_reason="$(printf '%s' "$report_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(d?.data?.end_reason??""))')"
report_first_coaching="$(printf '%s' "$report_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));const v=d?.data?.questions?.[0]?.coaching_message;process.stdout.write(v===undefined||v===null?"":String(v))')"
if [[ "$report_status" != "completed" || "$report_end_reason" != "completed_all_questions" ]]; then
  echo "[smoke-complete][error] report mismatch"
  printf '%s\n' "$report_response"
  exit 1
fi
if [[ -z "$report_first_coaching" ]]; then
  echo "[smoke-complete][error] report.questions[0].coaching_message not found"
  printf '%s\n' "$report_response"
  exit 1
fi

study_response="$(curl -sS -X GET "$BASE_URL/api/interview/sessions/$session_id/study" \
  -H "X-API-Key: $API_KEY")"
study_first_action_tip="$(printf '%s' "$study_response" | node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(0,"utf8"));const v=d?.data?.question_guides?.[0]?.action_tip;process.stdout.write(v===undefined||v===null?"":String(v))')"
if [[ -z "$study_first_action_tip" ]]; then
  echo "[smoke-complete][error] study.question_guides[0].action_tip not found"
  printf '%s\n' "$study_response"
  exit 1
fi

echo "[smoke-complete] done"
