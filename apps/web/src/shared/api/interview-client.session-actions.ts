import {
  endInterviewSession,
  getHealthStatus,
  getInterviewHistory,
  getInterviewSessionReport,
  getInterviewSessionState,
  startInterviewSession,
  submitInterviewAnswer
} from "@/shared/api/interview";
import {
  deleteRuntimeState,
  getRuntimeState,
  hasRuntimeState,
  runtimeStateEntries,
  setRuntimeState
} from "@/shared/api/interview-client.runtime";
import {
  mapPersistedSessionHistoryItem,
  mapReportToInterviewReport
} from "@/shared/api/interview-client.mappers";
import type {
  InterviewReport,
  SessionHistoryItem,
  StartInterviewPayload,
  StartInterviewResponse,
  SubmitAnswerResponse
} from "@/shared/api/interview-client.types";
import {
  buildAxisScoresFromApi,
  defaultStackByRole,
  mapCharacterFromApi,
  mapCharacterToApi,
  mapEmotion,
  mapRole,
  mapStatus,
  readResponseData,
  toIsoDate,
  toPercentScore
} from "@/shared/api/interview-client.utils";

async function refreshCurrentQuestionFromState(sessionId: string) {
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

async function ensureRuntimeState(sessionId: string) {
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

export async function startInterview(payload: StartInterviewPayload): Promise<StartInterviewResponse> {
  const parsedSourceSessionId = payload.sourceSessionId ? Number(payload.sourceSessionId) : undefined;
  const startResponse = await startInterviewSession({
    jobRole: payload.jobRole,
    stack: payload.stack,
    difficulty: payload.difficulty,
    interviewerCharacter: mapCharacterToApi(payload.character),
    retryMode: payload.retryMode,
    sourceSessionId: Number.isFinite(parsedSourceSessionId) ? parsedSourceSessionId : undefined
  });

  const data = readResponseData(startResponse, "세션 시작 실패");

  setRuntimeState(data.session_id, {
    payload,
    startedAt: toIsoDate(data.started_at),
    totalQuestions: data.total_questions,
    status: mapStatus(data.status),
    answeredQuestions: 0,
    currentQuestion: {
      questionId: data.first_question.question_id,
      order: 1,
      content: data.first_question.content,
      followupCount: 0
    }
  });

  return {
    sessionId: data.session_id,
    startedAt: toIsoDate(data.started_at)
  };
}

export function hasInterviewRuntimeState(sessionId: string) {
  return hasRuntimeState(sessionId);
}

export async function restoreInterviewSession(sessionId: string): Promise<void> {
  const stateResponse = await getInterviewSessionState(sessionId);
  const state = readResponseData(stateResponse, "세션 상태 조회 실패");

  if (mapStatus(state.status) !== "in_progress" || !state.current_question) {
    throw new Error("재개 가능한 진행중 세션이 없습니다. 새 면접을 시작해 주세요.");
  }

  const role = mapRole(state.job_role);
  setRuntimeState(sessionId, {
    payload: {
      jobRole: role,
      stack: defaultStackByRole(role),
      difficulty: "jobseeker",
      questionCount: state.total_questions,
      timerSeconds: 120,
      character: mapCharacterFromApi(state.interviewer_character),
      reactionEnabled: true
    },
    startedAt: toIsoDate(state.updated_at),
    totalQuestions: state.total_questions,
    status: "in_progress",
    answeredQuestions: state.answered_questions,
    currentQuestion: {
      questionId: state.current_question.question_id,
      order: state.current_question.question_order,
      content: state.current_question.content,
      followupCount: state.current_question.followup_count
    }
  });
}

export async function submitAnswer(
  sessionId: string,
  answer: string,
  inputType: "text" | "voice" = "text"
): Promise<SubmitAnswerResponse> {
  const runtimeState = await ensureRuntimeState(sessionId);
  if (!runtimeState.currentQuestion) {
    throw new Error("현재 질문이 없어 답변을 제출할 수 없습니다.");
  }

  const submitResponse = await submitInterviewAnswer({
    sessionId,
    questionId: runtimeState.currentQuestion.questionId,
    answerText: answer,
    inputType
  });

  const data = readResponseData(submitResponse, "답변 제출 실패");

  const previousFollowupCount = runtimeState.currentQuestion.followupCount;
  const shouldAskFollowup = Boolean(data.evaluation.followup_required && data.followup_question);
  const followupUsedCount = shouldAskFollowup ? previousFollowupCount + 1 : 0;

  if (data.session_completed) {
    runtimeState.status = "completed";
    runtimeState.answeredQuestions = runtimeState.totalQuestions;
    runtimeState.currentQuestion = null;
  } else if (shouldAskFollowup) {
    runtimeState.currentQuestion = {
      questionId: runtimeState.currentQuestion.questionId,
      order: runtimeState.currentQuestion.order,
      content: data.followup_question ?? runtimeState.currentQuestion.content,
      followupCount: followupUsedCount
    };
  } else if (data.next_question) {
    runtimeState.currentQuestion = {
      questionId: data.next_question.question_id,
      order: data.next_question.question_order,
      content: data.next_question.content,
      followupCount: 0
    };
    runtimeState.answeredQuestions = Math.max(runtimeState.answeredQuestions, data.next_question.question_order - 1);
  } else {
    await refreshCurrentQuestionFromState(sessionId);
  }

  const summary = data.feedback_summary?.trim() || null;
  const coachingMessage = data.coaching_message?.trim() || null;

  return {
    feedbackSummary: summary,
    coaching: coachingMessage,
    coachingAvailable: Boolean(data.coaching_available),
    axisScores: buildAxisScoresFromApi(data.evaluation),
    totalScore: toPercentScore(data.evaluation.total_score),
    suggestedEmotion: mapEmotion(data.interviewer_emotion),
    shouldAskFollowup,
    followupCount: shouldAskFollowup ? followupUsedCount : 0,
    isSessionComplete: data.session_completed,
    progress: {
      completedQuestions: runtimeState.answeredQuestions,
      totalQuestions: runtimeState.totalQuestions
    }
  };
}

export async function getReport(sessionId: string): Promise<InterviewReport> {
  try {
    const reportResponse = await getInterviewSessionReport(sessionId);
    const report = mapReportToInterviewReport(reportResponse);
    deleteRuntimeState(sessionId);
    return report;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message !== "세션이 아직 종료되지 않았습니다.") {
      throw error;
    }

    await endInterviewSession(sessionId, "user_end").catch(() => {
      // 이미 종료된 세션이면 무시
    });

    const fallbackReportResponse = await getInterviewSessionReport(sessionId);
    const report = mapReportToInterviewReport(fallbackReportResponse);
    deleteRuntimeState(sessionId);
    return report;
  }
}

export async function listSessions(days = 30): Promise<SessionHistoryItem[]> {
  const historyResponse = await getInterviewHistory(days);
  const historyData = readResponseData(historyResponse, "세션 목록 조회 실패");

  const groupedBySession = new Map<string, typeof historyData.items>();
  for (const item of historyData.items) {
    const grouped = groupedBySession.get(item.session_id) ?? [];
    grouped.push(item);
    groupedBySession.set(item.session_id, grouped);
  }

  const sessionIds = Array.from(groupedBySession.keys());
  const stateEntries = await Promise.all(
    sessionIds.map(async (sessionId) => {
      try {
        const stateResponse = await getInterviewSessionState(sessionId);
        const stateData = readResponseData(stateResponse, "세션 상태 조회 실패");
        return [sessionId, stateData] as const;
      } catch {
        return [sessionId, null] as const;
      }
    })
  );

  const stateMap = new Map(stateEntries);

  const historyItems = sessionIds.map((sessionId) =>
    mapPersistedSessionHistoryItem({
      sessionId,
      answers: groupedBySession.get(sessionId) ?? [],
      stateData: stateMap.get(sessionId) ?? null
    })
  );

  const runtimeOnlyItems: SessionHistoryItem[] = [];
  for (const [sessionId, runtimeState] of runtimeStateEntries()) {
    if (groupedBySession.has(sessionId)) {
      continue;
    }

    runtimeOnlyItems.push({
      sessionId,
      startedAt: runtimeState.startedAt,
      role: runtimeState.payload.jobRole,
      stack: runtimeState.payload.stack,
      totalScore: 0,
      questionCount: runtimeState.totalQuestions,
      status: runtimeState.status
    });
  }

  return [...runtimeOnlyItems, ...historyItems].sort(
    (left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()
  );
}

export async function pingBackendHealth() {
  const health = await getHealthStatus();
  if (health.status !== "UP") {
    throw new Error("백엔드 상태가 비정상입니다.");
  }
  return health;
}
