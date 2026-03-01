import type { StartInterviewPayload } from "@/shared/api/interview-client.types";

export type RuntimeQuestion = {
  questionId: string;
  order: number;
  content: string;
  followupCount: number;
};

export type SessionRuntimeState = {
  payload: StartInterviewPayload;
  startedAt: string;
  totalQuestions: number;
  status: "in_progress" | "completed";
  answeredQuestions: number;
  currentQuestion: RuntimeQuestion | null;
};

const streamStateBySessionId = new Map<string, SessionRuntimeState>();

export function hasRuntimeState(sessionId: string) {
  return streamStateBySessionId.has(sessionId);
}

export function getRuntimeState(sessionId: string) {
  return streamStateBySessionId.get(sessionId);
}

export function setRuntimeState(sessionId: string, state: SessionRuntimeState) {
  streamStateBySessionId.set(sessionId, state);
}

export function deleteRuntimeState(sessionId: string) {
  streamStateBySessionId.delete(sessionId);
}

export function runtimeStateEntries() {
  return streamStateBySessionId.entries();
}
