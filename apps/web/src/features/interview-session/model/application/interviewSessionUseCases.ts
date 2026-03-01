import {
  checkInterviewBackendHealthGateway,
  fetchInterviewGoogleAuthUrlGateway,
  fetchInterviewMyProfileGateway,
  fetchInterviewSessionStateGateway,
  fetchLatestActiveInterviewSessionGateway,
  hasInterviewRuntimeStateGateway,
  issueInterviewGuestAccessGateway,
  listInterviewSessionsGateway,
  restoreInterviewSessionGateway,
  streamInterviewQuestionGateway,
  submitInterviewAnswerGateway,
  type AuthMeApiResponse,
  type GoogleAuthUrlApiResponse,
  type GuestAuthApiResponse,
  type InterviewCharacter,
  type InterviewEmotion,
  type InterviewReport,
  type LatestActiveSessionApiResponse,
  type ReportQuestionGuide,
  type SessionHistoryItem,
  type SessionStateResponse,
  type StartInterviewPayload,
  type StreamQuestionEvent,
  type SubmitAnswerResponse
} from "@/features/interview-session/model/infrastructure/interviewSessionGateway";

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

export function startQuestionStreamUseCase(
  sessionId: string,
  onEvent: (event: StreamQuestionEvent) => void,
  onError?: (message: string) => void
) {
  return streamInterviewQuestionGateway(sessionId, onEvent, onError);
}

export function submitInterviewAnswerUseCase(
  sessionId: string,
  answer: string,
  inputType: "text" | "voice" = "text"
): Promise<SubmitAnswerResponse> {
  return submitInterviewAnswerGateway(sessionId, answer, inputType);
}

export function listInterviewSessionsUseCase(days = 30): Promise<SessionHistoryItem[]> {
  return listInterviewSessionsGateway(days);
}

export function restoreInterviewSessionUseCase(sessionId: string): Promise<void> {
  return restoreInterviewSessionGateway(sessionId);
}

export function hasInterviewRuntimeStateUseCase(sessionId: string): boolean {
  return hasInterviewRuntimeStateGateway(sessionId);
}

export function checkInterviewBackendHealthUseCase() {
  return checkInterviewBackendHealthGateway();
}

export function fetchInterviewGoogleAuthUrlUseCase(): Promise<GoogleAuthUrlApiResponse> {
  return fetchInterviewGoogleAuthUrlGateway();
}

export function fetchLatestActiveInterviewSessionUseCase(): Promise<LatestActiveSessionApiResponse> {
  return fetchLatestActiveInterviewSessionGateway();
}

export function fetchInterviewMyProfileUseCase(): Promise<AuthMeApiResponse> {
  return fetchInterviewMyProfileGateway();
}

export function issueInterviewGuestAccessUseCase(): Promise<GuestAuthApiResponse> {
  return issueInterviewGuestAccessGateway();
}

export function fetchInterviewSessionStateUseCase(sessionId: string): Promise<SessionStateResponse> {
  return fetchInterviewSessionStateGateway(sessionId);
}
