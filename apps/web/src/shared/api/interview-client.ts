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

export type InterviewRole = "backend" | "frontend" | "app" | "cloud" | "data" | "design" | "pm";
export type InterviewDifficulty = "jobseeker" | "junior";
export type InterviewCharacter = "zet" | "luna" | "iron";
export type InterviewEmotion = "neutral" | "encourage" | "pressure";

export type StartInterviewPayload = {
  jobRole: InterviewRole;
  stack: string;
  difficulty: InterviewDifficulty;
  questionCount: number;
  timerSeconds: number;
  character: InterviewCharacter;
  reactionEnabled: boolean;
};

export type StartInterviewResponse = {
  sessionId: string;
  startedAt: string;
};

export type StreamQuestionEvent =
  | {
      type: "chunk";
      text: string;
    }
  | {
      type: "done";
      questionId: string;
      order: number;
      followupCount: number;
      content: string;
    };

export type AxisKey = "technical" | "problemSolving" | "communication" | "delivery";

export type AxisScores = Record<AxisKey, number>;

export type SubmitAnswerResponse = {
  feedbackSummary: string;
  coaching: string;
  axisScores: AxisScores;
  totalScore: number;
  suggestedEmotion: InterviewEmotion;
  shouldAskFollowup: boolean;
  followupCount: number;
  isSessionComplete: boolean;
  progress: {
    completedQuestions: number;
    totalQuestions: number;
  };
};

export type ReportQuestionFeedback = {
  questionId: string;
  order: number;
  question: string;
  feedback: string;
  totalScore: number;
};

export type InterviewReport = {
  sessionId: string;
  summary: string;
  totalScore: number;
  axisScores: AxisScores;
  weakKeywords: string[];
  questionFeedback: ReportQuestionFeedback[];
  studyGuide: string[];
};

export type SessionHistoryItem = {
  sessionId: string;
  startedAt: string;
  role: InterviewRole;
  stack: string;
  totalScore: number;
  questionCount: number;
  status: "in_progress" | "completed";
};

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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toPercentScore(score: number | null | undefined) {
  if (!Number.isFinite(score)) {
    return 0;
  }

  const numericScore = Number(score);
  if (numericScore <= 5.0) {
    return clamp(Math.round(numericScore * 20), 0, 100);
  }

  return clamp(Math.round(numericScore), 0, 100);
}

function mapCharacterToApi(character: InterviewCharacter): "luna" | "jet" | "iron" {
  if (character === "zet") {
    return "jet";
  }
  return character;
}

function mapCharacterFromApi(character: "luna" | "jet" | "iron" | null | undefined): InterviewCharacter {
  if (character === "jet") {
    return "zet";
  }
  if (character === "luna") {
    return "luna";
  }
  return "iron";
}

function mapEmotion(value: string | null | undefined): InterviewEmotion {
  if (value === "encourage") {
    return "encourage";
  }
  if (value === "pressure") {
    return "pressure";
  }
  return "neutral";
}

function mapRole(value: string | null | undefined): InterviewRole {
  switch (value) {
    case "frontend":
    case "app":
    case "cloud":
    case "data":
    case "design":
    case "pm":
      return value;
    case "backend":
    default:
      return "backend";
  }
}

function mapDifficulty(value: string | null | undefined): InterviewDifficulty {
  return value === "junior" ? "junior" : "jobseeker";
}

function mapStatus(value: string | null | undefined): "in_progress" | "completed" {
  return value === "completed" ? "completed" : "in_progress";
}

function toIsoDate(value: string | null | undefined) {
  if (!value) {
    return new Date().toISOString();
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

function buildAxisScoresFromApi(data: {
  accuracy: number;
  logic: number;
  depth: number;
  delivery: number;
}): AxisScores {
  return {
    technical: toPercentScore(data.accuracy),
    problemSolving: toPercentScore(data.logic),
    communication: toPercentScore(data.depth),
    delivery: toPercentScore(data.delivery)
  };
}

function buildFollowupMessage(reason: string | null | undefined) {
  if (reason === "factual_error_or_uncertainty") {
    return "핵심 개념 정확도가 낮습니다. 정의와 근거를 먼저 제시해 주세요.";
  }
  if (reason === "missing_core_detail") {
    return "핵심 디테일이 부족합니다. 실무 예시를 포함해 확장해 주세요.";
  }
  if (reason === "weak_reasoning") {
    return "추론 근거가 약합니다. 결론-근거-예시 순서로 재구성해 주세요.";
  }
  if (reason === "followup_limit_reached") {
    return "꼬리질문 한도에 도달했습니다. 다음 문항에서 구조화된 답변을 시도해 주세요.";
  }
  return "답변 보강이 필요합니다. 핵심 개념과 근거를 함께 설명해 주세요.";
}

async function refreshCurrentQuestionFromState(sessionId: string) {
  const stateResponse = await getInterviewSessionState(sessionId);
  const state = stateResponse.data;

  const existing = streamStateBySessionId.get(sessionId);
  if (!existing) {
    return state;
  }

  const role = mapRole(state.job_role);
  existing.payload.jobRole = role;
  existing.payload.stack =
    typeof state.stack === "string" && state.stack.trim().length > 0
      ? state.stack.trim()
      : defaultStackByRole(role);
  existing.payload.difficulty = mapDifficulty(state.difficulty);
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

function readResponseData<T>(response: { success: boolean; data: T }, fallbackMessage: string): T {
  if (!response.success) {
    throw new Error(fallbackMessage);
  }
  return response.data;
}

export async function startInterview(payload: StartInterviewPayload): Promise<StartInterviewResponse> {
  const startResponse = await startInterviewSession({
    jobRole: payload.jobRole,
    stack: payload.stack,
    difficulty: payload.difficulty,
    interviewerCharacter: mapCharacterToApi(payload.character)
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
  const difficulty = mapDifficulty(state.difficulty);
  const stack = typeof state.stack === "string" && state.stack.trim().length > 0
    ? state.stack.trim()
    : defaultStackByRole(role);
  streamStateBySessionId.set(sessionId, {
    payload: {
      jobRole: role,
      stack,
      difficulty,
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

function parseApiErrorMessage(raw: string, status: number) {
  if (status === 401 || status === 403) {
    return getAuthRequiredMessage();
  }

  if (!raw) {
    return `질문 스트리밍 요청이 실패했습니다. (${status})`;
  }

  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string }; message?: string };
    return parsed.error?.message || parsed.message || raw;
  } catch {
    return raw;
  }
}

function parseTokenText(data: string) {
  if (!data || data === "[DONE]") {
    return "";
  }

  try {
    const parsed = JSON.parse(data) as {
      text?: string;
      token?: string;
      choices?: Array<{
        text?: string;
        delta?: { content?: string };
      }>;
    };
    if (typeof parsed.text === "string") {
      return parsed.text;
    }
    if (typeof parsed.token === "string") {
      return parsed.token;
    }
    const choice = parsed.choices?.[0];
    if (typeof choice?.delta?.content === "string") {
      return choice.delta.content;
    }
    if (typeof choice?.text === "string") {
      return choice.text;
    }
    return "";
  } catch {
    return data;
  }
}

type SseHandlers = {
  onToken: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
  onActivity?: () => void;
};

function parseSseBlock(rawBlock: string) {
  const lines = rawBlock.split(/\r?\n/);
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  return {
    eventName,
    data: dataLines.join("\n")
  };
}

async function consumeSseResponse(body: ReadableStream<Uint8Array>, handlers: SseHandlers) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let doneReceived = false;

  const handleBlock = (rawBlock: string) => {
    handlers.onActivity?.();
    const { eventName, data } = parseSseBlock(rawBlock);
    if (!data) {
      return;
    }

    if (eventName === "error") {
      handlers.onError(data);
      return;
    }

    if (eventName === "done" || data === "[DONE]") {
      doneReceived = true;
      handlers.onDone();
      return;
    }

    if (eventName === "token" || eventName === "message") {
      const tokenText = parseTokenText(data);
      if (tokenText) {
        handlers.onToken(tokenText);
      }
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    handlers.onActivity?.();
    buffer += decoder.decode(value, { stream: true }).replaceAll("\r", "");
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      handleBlock(block);
      if (doneReceived) {
        return;
      }
    }
  }

  const tail = buffer.trim();
  if (tail) {
    handleBlock(tail);
  }

  if (!doneReceived) {
    handlers.onError("스트리밍이 비정상 종료되었습니다. 잠시 후 다시 시도해 주세요.");
  }
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
        throw new Error(parseApiErrorMessage(rawError, response.status || 502));
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

  const followupUsedCount = Math.max(0, 2 - data.evaluation.followup_remaining);
  const shouldAskFollowup = Boolean(data.evaluation.followup_required && data.followup_question);

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

  const summary = data.evaluation.followup_required
    ? buildFollowupMessage(data.evaluation.followup_reason)
    : "답변 흐름이 좋습니다. 다음 문항도 결론-근거-예시 순서를 유지해 보세요.";

  return {
    feedbackSummary: summary,
    coaching: data.coaching_message,
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
  const data = readResponseData(reportResponse, "리포트 조회 실패");

  const axisScores = buildAxisScoresFromApi(data.score_summary);
  const totalScore = toPercentScore(data.score_summary.total_score);

  const questionFeedback: ReportQuestionFeedback[] = data.questions.map((question) => ({
    questionId: question.question_id,
    order: question.question_order,
    question: question.question_content,
    feedback: question.improvement_tip || question.coaching_message,
    totalScore: toPercentScore(question.score.total_score)
  }));

  const studyGuide = [
    ...data.priority_focuses.map((focus) => `${focus} 축을 우선적으로 보완하세요.`),
    ...data.questions.slice(0, 3).map((question) => question.improvement_tip)
  ].filter(Boolean);

  const summary = `총 ${data.answered_questions}/${data.total_questions}문항 답변, 성과 레벨 ${data.performance_level}.`;

  return {
    sessionId: data.session_id,
    summary,
    totalScore,
    axisScores,
    weakKeywords: data.weak_keywords,
    questionFeedback,
    studyGuide
  };
}

export async function getReport(sessionId: string): Promise<InterviewReport> {
  try {
    const reportResponse = await getInterviewSessionReport(sessionId);
    const report = mapReportToInterviewReport(reportResponse);
    streamStateBySessionId.delete(sessionId);
    return report;
  } catch {
    await endInterviewSession(sessionId, "user_end").catch(() => {
      // 이미 종료된 세션이면 무시
    });

    const fallbackReportResponse = await getInterviewSessionReport(sessionId);
    const report = mapReportToInterviewReport(fallbackReportResponse);
    streamStateBySessionId.delete(sessionId);
    return report;
  }
}

function defaultStackByRole(role: InterviewRole) {
  switch (role) {
    case "backend":
      return "Spring Boot";
    case "frontend":
      return "Next.js";
    case "app":
      return "React Native";
    case "cloud":
      return "AWS";
    case "data":
      return "Python";
    case "design":
      return "Figma";
    case "pm":
      return "PRD";
    default:
      return "Spring Boot";
  }
}

function pickLatestDate(values: string[]) {
  if (values.length === 0) {
    return new Date().toISOString();
  }

  return (
    values
      .map((value) => new Date(value).getTime())
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => b - a)
      .map((value) => new Date(value).toISOString())[0] ?? new Date().toISOString()
  );
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
    const stack = typeof stateData?.stack === "string" && stateData.stack.trim().length > 0
      ? stateData.stack.trim()
      : defaultStackByRole(role);
    const scoreAverage =
      answers.length === 0
        ? 0
        : Math.round(answers.reduce((sum, item) => sum + toPercentScore(item.total_score), 0) / answers.length);

    const startedAt = pickLatestDate(answers.map((item) => item.answered_at));

    return {
      sessionId,
      startedAt,
      role,
      stack,
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
