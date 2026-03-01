import { getAuthRequiredMessage } from "@/shared/auth/session";
import {
  consumeSseResponse,
  parseApiErrorMessage
} from "@/shared/api/interview-client.stream";
import {
  getRuntimeState,
  type RuntimeQuestion
} from "@/shared/api/interview-client.runtime";
import type { StreamQuestionEvent } from "@/shared/api/interview-client.types";

const CHAT_STREAM_ENDPOINT = "/api/chat";
const STREAM_IDLE_TIMEOUT_MS = 12_000;
const ENABLE_REMOTE_QUESTION_STREAM = process.env.NEXT_PUBLIC_ENABLE_REMOTE_QUESTION_STREAM === "true";

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
  const runtimeState = getRuntimeState(sessionId);
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
