"use client";

import type { ChatMessage } from "@/shared/chat/ChatBoard";

const COACH_WARNING_SCORE_THRESHOLD = 70;

export function isCoachWarning(totalScore: number) {
  return totalScore < COACH_WARNING_SCORE_THRESHOLD;
}

export function buildCoachContent(feedbackSummary: string | null, coaching: string | null) {
  return [feedbackSummary, coaching]
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item))
    .join("\n");
}

function createMessageId(prefix: "answer" | "coach" | "error" | "pause") {
  return `${prefix}-${Date.now()}`;
}

export function createUserAnswerMessage(content: string): ChatMessage {
  return {
    id: createMessageId("answer"),
    role: "user",
    content
  };
}

export function createCoachFeedbackMessage(content: string, warning: boolean): ChatMessage {
  return {
    id: createMessageId("coach"),
    role: "coach",
    content,
    tone: warning ? "error" : "default"
  };
}

export function createAnswerErrorMessage(message: string): ChatMessage {
  return {
    id: createMessageId("error"),
    role: "coach",
    content: `요청 처리 중 오류가 발생했습니다: ${message}`,
    tone: "error"
  };
}

export function createPauseMessage(): ChatMessage {
  return {
    id: createMessageId("pause"),
    role: "coach",
    content: "일시정지 상태입니다. 준비되면 답변 완료 버튼으로 계속 진행하세요."
  };
}
