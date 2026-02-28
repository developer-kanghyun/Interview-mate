import {
  endInterviewSession,
  getHealthStatus,
  getInterviewHistory,
  getInterviewSessionReport,
  getInterviewSessionState,
  startInterviewSession,
  submitInterviewAnswer,
  type SessionReportResponse
} from "@/shared/api/interview";
import { getAuthRequiredMessage } from "@/shared/auth/session";
import {
  consumeSseResponse,
  parseApiErrorMessage
} from "@/shared/api/interview-client.stream";
import type {
  InterviewCharacter,
  InterviewDifficulty,
  InterviewEmotion,
  InterviewReport,
  InterviewRole,
  ReportQuestionFeedback,
  ReportQuestionGuide,
  SessionHistoryItem,
  StartInterviewPayload,
  StartInterviewResponse,
  StreamQuestionEvent,
  SubmitAnswerResponse
} from "@/shared/api/interview-client.types";
import {
  buildAxisScoresFromApi,
  dedupeAndLimitGuide,
  defaultStackByRole,
  mapCharacterFromApi,
  mapCharacterToApi,
  mapEmotion,
  mapRole,
  mapStatus,
  pickLatestDate,
  readReportData,
  readResponseData,
  toIsoDate,
  toPercentScore
} from "@/shared/api/interview-client.utils";

export type {
  AxisKey,
  AxisScores,
  InterviewCharacter,
  InterviewDifficulty,
  InterviewEmotion,
  InterviewReport,
  InterviewRole,
  ReportQuestionFeedback,
  ReportQuestionGuide,
  SessionHistoryItem,
  StartInterviewPayload,
  StartInterviewResponse,
  StreamQuestionEvent,
  SubmitAnswerResponse
} from "@/shared/api/interview-client.types";

type RuntimeQuestion = {
  questionId: string;
  order: number;
  content: string;
  followupCount: number;
};

type SessionRuntimeState = {
  payload: StartInterviewPayload;
  startedAt: string;
  totalQuestions: number;
  status: "in_progress" | "completed";
  answeredQuestions: number;
  currentQuestion: RuntimeQuestion | null;
};

const streamStateBySessionId = new Map<string, SessionRuntimeState>();
const CHAT_STREAM_ENDPOINT = "/api/chat";
const STREAM_IDLE_TIMEOUT_MS = 12_000;
const ENABLE_REMOTE_QUESTION_STREAM = process.env.NEXT_PUBLIC_ENABLE_REMOTE_QUESTION_STREAM === "true";

async function refreshCurrentQuestionFromState(sessionId: string) {
  const stateResponse = await getInterviewSessionState(sessionId);
  const state = stateResponse.data;

  const existing = streamStateBySessionId.get(sessionId);
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
  const runtimeState = streamStateBySessionId.get(sessionId);
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

  streamStateBySessionId.set(data.session_id, {
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
  return streamStateBySessionId.has(sessionId);
}

export async function restoreInterviewSession(sessionId: string): Promise<void> {
  const stateResponse = await getInterviewSessionState(sessionId);
  const state = readResponseData(stateResponse, "세션 상태 조회 실패");

  if (mapStatus(state.status) !== "in_progress" || !state.current_question) {
    throw new Error("재개 가능한 진행중 세션이 없습니다. 새 면접을 시작해 주세요.");
  }

  const role = mapRole(state.job_role);
  streamStateBySessionId.set(sessionId, {
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

function buildQuestionStreamPrompt(questionContent: string) {
  return `다음 면접 질문 문장을 원문 그대로 한 번만 출력해 주세요. 설명이나 해설은 추가하지 마세요.\n\n${questionContent}`;
}

function streamQuestionLocallyFromContent(
  question: RuntimeQuestion,
  onEvent: (event: StreamQuestionEvent) => void,
  initialCursor = 0
) {
  const content = question.content;
  const chunkSize = Math.max(1, Math.floor(content.length / 20));
  let cursor = Math.min(Math.max(initialCursor, 0), content.length);

  const intervalId = window.setInterval(() => {
    cursor += chunkSize;

    if (cursor >= content.length) {
      window.clearInterval(intervalId);
      onEvent({
        type: "done",
        questionId: question.questionId,
        order: question.order,
        followupCount: question.followupCount,
        content
      });
      return;
    }

    onEvent({
      type: "chunk",
      text: content.slice(0, cursor)
    });
  }, 45);

  return () => {
    window.clearInterval(intervalId);
  };
}

export function streamQuestion(
  sessionId: string,
  onEvent: (event: StreamQuestionEvent) => void,
  onError?: (message: string) => void
) {
  const runtimeState = streamStateBySessionId.get(sessionId);
  if (!runtimeState?.currentQuestion) {
    throw new Error("현재 질문 상태가 없습니다. 세션을 복구하거나 다시 시작해 주세요.");
  }

  const question = runtimeState.currentQuestion;
  const content = question.content;
  const controller = new AbortController();
  let fallbackCleanup: (() => void) | null = null;
  let idleTimer: number | null = null;
  let stopRequested = false;
  let cursor = 0;

  // 기본값은 로컬 스트리밍으로 고정해 프록시 오류(/api/chat 500) 의존을 제거한다.
  if (!ENABLE_REMOTE_QUESTION_STREAM) {
    const cleanup = streamQuestionLocallyFromContent(question, onEvent, cursor);
    return () => {
      stopRequested = true;
      cleanup();
    };
  }

  const clearIdleTimer = () => {
    if (idleTimer !== null) {
      window.clearTimeout(idleTimer);
      idleTimer = null;
    }
  };

  const resetIdleTimer = () => {
    clearIdleTimer();
    idleTimer = window.setTimeout(() => {
      controller.abort("stream-idle-timeout");
    }, STREAM_IDLE_TIMEOUT_MS);
  };

  const startFallback = () => {
    if (fallbackCleanup) {
      return;
    }
    fallbackCleanup = streamQuestionLocallyFromContent(question, onEvent, cursor);
  };

  void (async () => {
    try {
      resetIdleTimer();

      const response = await fetch(CHAT_STREAM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: buildQuestionStreamPrompt(content)
        }),
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        const rawError = await response.text().catch(() => "");
        throw new Error(parseApiErrorMessage(rawError, response.status || 502, getAuthRequiredMessage()));
      }

      await consumeSseResponse(response.body, {
        onToken: (tokenText) => {
          cursor = Math.min(content.length, cursor + Math.max(1, tokenText.length));
          onEvent({
            type: "chunk",
            text: content.slice(0, cursor)
          });
        },
        onDone: () => {
          clearIdleTimer();
          onEvent({
            type: "done",
            questionId: question.questionId,
            order: question.order,
            followupCount: question.followupCount,
            content
          });
        },
        onError: (message) => {
          throw new Error(message || "질문 스트리밍에 실패했습니다.");
        },
        onActivity: () => {
          resetIdleTimer();
        }
      });
    } catch (error) {
      clearIdleTimer();
      if (stopRequested) {
        return;
      }
      if (error instanceof Error && error.message === getAuthRequiredMessage()) {
        onError?.(error.message);
        return;
      }
      startFallback();
      if (!fallbackCleanup) {
        const message = error instanceof Error ? error.message : "질문 스트리밍에 실패했습니다.";
        onError?.(message);
      }
    }
  })();

  return () => {
    stopRequested = true;
    clearIdleTimer();
    controller.abort();
    if (fallbackCleanup) {
      fallbackCleanup();
      fallbackCleanup = null;
    }
  };
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

function mapReportToInterviewReport(reportResponse: SessionReportResponse): InterviewReport {
  const data = readReportData(reportResponse);

  const axisScores = buildAxisScoresFromApi(data.score_summary);
  const totalScore = toPercentScore(data.score_summary.total_score);

  const questionFeedback: ReportQuestionFeedback[] = data.questions.map((question) => ({
    questionId: question.question_id,
    order: question.question_order,
    question: question.question_content,
    feedback: question.improvement_tip || question.coaching_message || "피드백을 불러오지 못했습니다.",
    totalScore: toPercentScore(question.score.total_score),
    whyWeak:
      question.why_weak?.trim() ||
      question.improvement_tip ||
      "핵심 개념과 근거 설명이 부족해 답변 설득력이 낮았습니다.",
    howToAnswer:
      question.how_to_answer?.trim() ||
      question.coaching_message?.trim() ||
      "답변을 결론-근거-예시 순서로 구성해 주세요.",
    exampleAnswer:
      question.example_answer?.trim() ||
      question.model_answer?.trim() ||
      "예시 답변을 생성하지 못했습니다."
  }));

  const questionGuides: ReportQuestionGuide[] = data.questions.map((question) => ({
    questionId: question.question_id,
    order: question.question_order,
    question: question.question_content,
    interviewerEmotion: mapEmotion(question.interviewer_emotion),
    weakConceptKeywords: question.weak_concept_keywords ?? [],
    actionTip: question.coaching_message || question.improvement_tip || "핵심 개념부터 답변하세요.",
    howToAnswer:
      question.how_to_answer?.trim() ||
      question.coaching_message?.trim() ||
      "결론-근거-예시 구조로 답변하세요.",
    exampleAnswer:
      question.example_answer?.trim() ||
      question.model_answer?.trim() ||
      "예시 답변을 생성하지 못했습니다."
  }));

  const studyGuide = dedupeAndLimitGuide([
    ...data.priority_focuses.map((focus) => `${focus} 축을 우선적으로 보완하세요.`),
    ...data.questions.slice(0, 3).map((question) => question.improvement_tip)
  ]);

  const summary = `총 ${data.answered_questions}/${data.total_questions}문항 답변, 성과 레벨 ${data.performance_level}.`;

  return {
    sessionId: data.session_id,
    summary,
    totalScore,
    axisScores,
    weakKeywords: data.weak_keywords,
    questionFeedback,
    studyGuide,
    questionGuides
  };
}

export async function getReport(sessionId: string): Promise<InterviewReport> {
  try {
    const reportResponse = await getInterviewSessionReport(sessionId);
    const report = mapReportToInterviewReport(reportResponse);
    streamStateBySessionId.delete(sessionId);
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
    streamStateBySessionId.delete(sessionId);
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

  const historyItems = sessionIds.map((sessionId) => {
    const answers = groupedBySession.get(sessionId) ?? [];
    const stateData = stateMap.get(sessionId);

    const role = mapRole(stateData?.job_role);
    const scoreAverage =
      answers.length === 0
        ? 0
        : Math.round(answers.reduce((sum, item) => sum + toPercentScore(item.total_score), 0) / answers.length);

    const startedAt = pickLatestDate(answers.map((item) => item.answered_at));

    return {
      sessionId,
      startedAt,
      role,
      stack: defaultStackByRole(role),
      totalScore: scoreAverage,
      questionCount: stateData?.total_questions ?? Math.max(1, ...answers.map((item) => item.question_order)),
      status: mapStatus(stateData?.status)
    } satisfies SessionHistoryItem;
  });

  const runtimeOnlyItems: SessionHistoryItem[] = [];
  for (const [sessionId, runtimeState] of streamStateBySessionId.entries()) {
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
