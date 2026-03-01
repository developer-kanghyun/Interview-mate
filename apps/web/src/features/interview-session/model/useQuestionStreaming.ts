"use client";

import { useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import { startQuestionStreamUseCase } from "@/features/interview-session/model/application/interviewSessionUseCases";
import type { ChatMessage } from "@/shared/chat/ChatBoard";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";

type UseQuestionStreamingParams = {
  stopTtsPlayback: () => void;
  appendMessage: (message: ChatMessage) => void;
  speakInterviewer: (text: string) => Promise<void>;
  setUiError: Dispatch<SetStateAction<string | null>>;
  setIsQuestionStreaming: Dispatch<SetStateAction<boolean>>;
  setStreamingQuestionText: Dispatch<SetStateAction<string>>;
  setAvatarState: Dispatch<SetStateAction<AvatarState>>;
  setQuestionOrder: Dispatch<SetStateAction<number>>;
  setFollowupCount: Dispatch<SetStateAction<number>>;
};

type UseQuestionStreamingResult = {
  stopQuestionStream: () => void;
  startQuestionStream: (sessionId: string) => void;
};

export function useQuestionStreaming({
  stopTtsPlayback,
  appendMessage,
  speakInterviewer,
  setUiError,
  setIsQuestionStreaming,
  setStreamingQuestionText,
  setAvatarState,
  setQuestionOrder,
  setFollowupCount
}: UseQuestionStreamingParams): UseQuestionStreamingResult {
  const streamCleanupRef = useRef<(() => void) | null>(null);

  const stopQuestionStream = useCallback(() => {
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
      streamCleanupRef.current = null;
    }
  }, []);

  const startQuestionStream = useCallback(
    (sessionId: string) => {
      stopQuestionStream();
      stopTtsPlayback();
      setUiError(null);
      setIsQuestionStreaming(true);
      setStreamingQuestionText("");
      setAvatarState("asking");

      try {
        const unsubscribe = startQuestionStreamUseCase(
          sessionId,
          (event) => {
            if (event.type === "chunk") {
              setStreamingQuestionText(event.text);
              return;
            }

            setQuestionOrder(event.order);
            setFollowupCount(event.followupCount);
            setStreamingQuestionText(event.content);
            setIsQuestionStreaming(false);

            appendMessage({
              id: `${event.questionId}-${Date.now()}`,
              role: "interviewer",
              content: event.content
            });

            void speakInterviewer(event.content);
          },
          (message) => {
            setUiError(message || "질문 스트리밍에 실패했습니다.");
            setIsQuestionStreaming(false);
            setAvatarState("listening");
          }
        );

        streamCleanupRef.current = unsubscribe;
      } catch (error) {
        const message = error instanceof Error ? error.message : "질문 스트리밍에 실패했습니다.";
        setUiError(message);
        setIsQuestionStreaming(false);
      }
    },
    [
      appendMessage,
      setAvatarState,
      setFollowupCount,
      setIsQuestionStreaming,
      setQuestionOrder,
      setStreamingQuestionText,
      setUiError,
      speakInterviewer,
      stopQuestionStream,
      stopTtsPlayback
    ]
  );

  return {
    stopQuestionStream,
    startQuestionStream
  };
}
