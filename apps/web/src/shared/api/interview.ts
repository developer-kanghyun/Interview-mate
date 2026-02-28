import { requestJson } from "@/shared/api/http";
import {
  AUTH_REQUEST_TIMEOUT_MS,
  HEALTH_REQUEST_TIMEOUT_MS,
  REPORT_REQUEST_TIMEOUT_MS,
  SESSION_READ_TIMEOUT_MS,
  START_SESSION_TIMEOUT_MS,
  SUBMIT_ANSWER_TIMEOUT_MS
} from "@/shared/api/interview.timeouts";
import type {
  AnswerSubmitResponse,
  AuthMeApiResponse,
  GoogleAuthCallbackApiResponse,
  GoogleAuthUrlApiResponse,
  GuestAuthApiResponse,
  HealthApiResponse,
  InterviewHistoryApiResponse,
  LatestActiveSessionApiResponse,
  SessionEndReason,
  SessionEndResponse,
  SessionReportResponse,
  SessionStartResponse,
  SessionStateResponse,
  SessionStudyResponse,
  SessionTimelineResponse,
  StartInterviewSessionPayload,
  SubmitInterviewAnswerPayload
} from "@/shared/api/interview.types";

export type {
  AnswerSubmitResponse,
  AuthMeApiResponse,
  GoogleAuthCallbackApiResponse,
  GoogleAuthUrlApiResponse,
  GuestAuthApiResponse,
  HealthApiResponse,
  InterviewCharacterApi,
  InterviewDifficultyApi,
  InterviewEmotionApi,
  InterviewHistoryApiResponse,
  InterviewRoleApi,
  LatestActiveSessionApiResponse,
  SessionEndReason,
  SessionEndResponse,
  SessionReportResponse,
  SessionStartResponse,
  SessionStateResponse,
  SessionStudyResponse,
  SessionTimelineResponse,
  StartInterviewSessionPayload,
  SubmitInterviewAnswerPayload
} from "@/shared/api/interview.types";

export async function startInterviewSession(payload: StartInterviewSessionPayload) {
  return requestJson<SessionStartResponse>("/api/interview/sessions/start", {
    method: "POST",
    timeoutMs: START_SESSION_TIMEOUT_MS,
    body: {
      job_role: payload.jobRole,
      stack: payload.stack,
      difficulty: payload.difficulty,
      interviewer_character: payload.interviewerCharacter,
      retry_mode: payload.retryMode,
      source_session_id: payload.sourceSessionId
    },
    fallbackMessage: "세션 시작 실패"
  });
}

export async function submitInterviewAnswer(payload: SubmitInterviewAnswerPayload) {
  return requestJson<AnswerSubmitResponse>(`/api/interview/sessions/${payload.sessionId}/answers`, {
    method: "POST",
    timeoutMs: SUBMIT_ANSWER_TIMEOUT_MS,
    body: {
      question_id: Number(payload.questionId),
      answer_text: payload.answerText,
      input_type: payload.inputType
    },
    fallbackMessage: "답변 제출 실패"
  });
}

export async function getInterviewSessionReport(sessionId: string) {
  return requestJson<SessionReportResponse>(`/api/interview/sessions/${sessionId}/report`, {
    method: "GET",
    timeoutMs: REPORT_REQUEST_TIMEOUT_MS,
    fallbackMessage: "리포트 조회 실패"
  });
}

export async function getInterviewSessionStudy(sessionId: string) {
  return requestJson<SessionStudyResponse>(`/api/interview/sessions/${sessionId}/study`, {
    method: "GET",
    timeoutMs: SESSION_READ_TIMEOUT_MS,
    fallbackMessage: "공부 가이드 조회 실패"
  });
}

export async function getInterviewSessionTimeline(sessionId: string) {
  return requestJson<SessionTimelineResponse>(`/api/interview/sessions/${sessionId}/timeline`, {
    method: "GET",
    timeoutMs: SESSION_READ_TIMEOUT_MS,
    fallbackMessage: "세션 타임라인 조회 실패"
  });
}

export async function getInterviewSessionState(sessionId: string) {
  return requestJson<SessionStateResponse>(`/api/interview/sessions/${sessionId}`, {
    method: "GET",
    timeoutMs: SESSION_READ_TIMEOUT_MS,
    fallbackMessage: "세션 상태 조회 실패"
  });
}

export async function endInterviewSession(sessionId: string, reason: SessionEndReason = "user_end") {
  return requestJson<SessionEndResponse>(`/api/interview/sessions/${sessionId}/end`, {
    method: "POST",
    timeoutMs: SESSION_READ_TIMEOUT_MS,
    body: {
      reason
    },
    fallbackMessage: "세션 종료 실패"
  });
}

export async function getLatestActiveInterviewSession() {
  return requestJson<LatestActiveSessionApiResponse>("/api/interview/sessions/latest-active", {
    method: "GET",
    timeoutMs: SESSION_READ_TIMEOUT_MS,
    fallbackMessage: "최근 진행 세션 조회 실패"
  });
}

export async function getInterviewHistory(days = 30) {
  return requestJson<InterviewHistoryApiResponse>(`/api/interview/history?days=${days}`, {
    method: "GET",
    timeoutMs: SESSION_READ_TIMEOUT_MS,
    fallbackMessage: "히스토리 조회 실패"
  });
}

export async function getGoogleAuthUrl() {
  return requestJson<GoogleAuthUrlApiResponse>("/api/auth/google/url", {
    method: "GET",
    requireAuth: false,
    timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
    fallbackMessage: "Google 로그인 URL 조회 실패"
  });
}

export async function completeGoogleAuth(code: string, state?: string | null) {
  const query = new URLSearchParams();
  query.set("code", code);
  if (state) {
    query.set("state", state);
  }
  return requestJson<GoogleAuthCallbackApiResponse>(`/api/auth/google/callback?${query.toString()}`, {
    method: "GET",
    requireAuth: false,
    timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
    fallbackMessage: "Google 로그인 처리 실패"
  });
}

export async function getGuestAccess() {
  return requestJson<GuestAuthApiResponse>("/api/auth/guest", {
    method: "GET",
    requireAuth: false,
    timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
    fallbackMessage: "게스트 인증 발급 실패"
  });
}

export async function getMyProfile() {
  return requestJson<AuthMeApiResponse>("/api/auth/me", {
    method: "GET",
    timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
    fallbackMessage: "로그인 사용자 조회 실패"
  });
}

export async function getHealthStatus() {
  return requestJson<HealthApiResponse>("/health", {
    method: "GET",
    requireAuth: false,
    timeoutMs: HEALTH_REQUEST_TIMEOUT_MS,
    fallbackMessage: "백엔드 연결 확인 실패"
  });
}
