import { getInterviewSessionState } from "@/shared/api/interview";
import { getRuntimeState } from "@/shared/api/interview-client.runtime";
import { mapStatus } from "@/shared/api/interview-client.utils";

export async function refreshCurrentQuestionFromState(sessionId: string) {
  const stateResponse = await getInterviewSessionState(sessionId);
  const state = stateResponse.data;

  const existing = getRuntimeState(sessionId);
  if (!existing) {
    return state;
  }

  existing.status = mapStatus(state.status);
  existing.totalQuestions = state.total_questions;
  existing.answeredQuestions = state.answered_questions;

  if (state.current_question) {
    existing.currentQuestion = {
      questionId: state.current_question.question_id,
      order: state.current_question.question_order,
      content: state.current_question.content,
      followupCount: state.current_question.followup_count
    };
  } else {
    existing.currentQuestion = null;
  }

  return state;
}

export async function ensureRuntimeState(sessionId: string) {
  const runtimeState = getRuntimeState(sessionId);
  if (runtimeState?.currentQuestion) {
    return runtimeState;
  }

  if (runtimeState) {
    await refreshCurrentQuestionFromState(sessionId);
    return runtimeState;
  }

  throw new Error("세션 상태를 찾을 수 없습니다. 면접을 다시 시작해 주세요.");
}
