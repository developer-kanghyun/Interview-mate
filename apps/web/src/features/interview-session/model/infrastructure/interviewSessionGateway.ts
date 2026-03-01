import {
  hasInterviewRuntimeState,
  listSessions,
  pingBackendHealth,
  restoreInterviewSession,
  streamQuestion,
  submitAnswer,
  type InterviewCharacter,
  type InterviewEmotion,
  type InterviewReport,
  type ReportQuestionGuide,
  type SessionHistoryItem,
  type StartInterviewPayload,
  type StreamQuestionEvent,
  type SubmitAnswerResponse
} from "@/shared/api/interview-client";
import {
  getGoogleAuthUrl,
  getGuestAccess,
  getInterviewSessionState,
  getLatestActiveInterviewSession,
  getMyProfile,
  type AuthMeApiResponse,
  type GoogleAuthUrlApiResponse,
  type GuestAuthApiResponse,
  type LatestActiveSessionApiResponse,
  type SessionStateResponse
} from "@/shared/api/interview";

export type {
  AuthMeApiResponse,
  GoogleAuthUrlApiResponse,
  GuestAuthApiResponse,
  InterviewCharacter,
  InterviewEmotion,
  InterviewReport,
  LatestActiveSessionApiResponse,
  ReportQuestionGuide,
  SessionHistoryItem,
  SessionStateResponse,
  StartInterviewPayload,
  StreamQuestionEvent,
  SubmitAnswerResponse
};

export function streamInterviewQuestionGateway(
  sessionId: string,
  onEvent: (event: StreamQuestionEvent) => void,
  onError?: (message: string) => void
) {
  return streamQuestion(sessionId, onEvent, onError);
}

export function submitInterviewAnswerGateway(
  sessionId: string,
  answer: string,
  inputType: "text" | "voice" = "text"
): Promise<SubmitAnswerResponse> {
  return submitAnswer(sessionId, answer, inputType);
}

export function listInterviewSessionsGateway(days = 30): Promise<SessionHistoryItem[]> {
  return listSessions(days);
}

export function restoreInterviewSessionGateway(sessionId: string): Promise<void> {
  return restoreInterviewSession(sessionId);
}

export function hasInterviewRuntimeStateGateway(sessionId: string): boolean {
  return hasInterviewRuntimeState(sessionId);
}

export function checkInterviewBackendHealthGateway() {
  return pingBackendHealth();
}

export function fetchInterviewGoogleAuthUrlGateway(): Promise<GoogleAuthUrlApiResponse> {
  return getGoogleAuthUrl();
}

export function fetchLatestActiveInterviewSessionGateway(): Promise<LatestActiveSessionApiResponse> {
  return getLatestActiveInterviewSession();
}

export function fetchInterviewMyProfileGateway(): Promise<AuthMeApiResponse> {
  return getMyProfile();
}

export function issueInterviewGuestAccessGateway(): Promise<GuestAuthApiResponse> {
  return getGuestAccess();
}

export function fetchInterviewSessionStateGateway(sessionId: string): Promise<SessionStateResponse> {
  return getInterviewSessionState(sessionId);
}
