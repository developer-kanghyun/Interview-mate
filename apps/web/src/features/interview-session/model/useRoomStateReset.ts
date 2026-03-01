"use client";

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { createPauseMessage } from "@/features/interview-session/model/interviewRoom.utils";
import type { ChatMessage } from "@/shared/chat/ChatBoard";

type UseRoomStateResetOptions = {
  clearAvatarCue: () => void;
  setAvatarState: (state: "idle") => void;
  appendMessage: (nextMessage: ChatMessage) => void;
  setQuestionOrder: Dispatch<SetStateAction<number>>;
  setFollowupCount: Dispatch<SetStateAction<number>>;
  lastFollowupCountRef: MutableRefObject<number>;
  setStreamingQuestionText: Dispatch<SetStateAction<string>>;
  setIsQuestionStreaming: Dispatch<SetStateAction<boolean>>;
  setAnswerText: Dispatch<SetStateAction<string>>;
  setEmotionNeutral: () => void;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
};

export function useRoomStateReset({
  clearAvatarCue,
  setAvatarState,
  appendMessage,
  setQuestionOrder,
  setFollowupCount,
  lastFollowupCountRef,
  setStreamingQuestionText,
  setIsQuestionStreaming,
  setAnswerText,
  setEmotionNeutral,
  setMessages
}: UseRoomStateResetOptions) {
  const handlePause = useCallback(() => {
    clearAvatarCue();
    setAvatarState("idle");
    appendMessage(createPauseMessage());
  }, [appendMessage, clearAvatarCue, setAvatarState]);

  const resetRoomState = useCallback(
    (next: { questionOrder: number; followupCount: number; clearMessages?: boolean }) => {
      setQuestionOrder(next.questionOrder);
      setFollowupCount(next.followupCount);
      lastFollowupCountRef.current = next.followupCount;
      setStreamingQuestionText("");
      setIsQuestionStreaming(false);
      setAnswerText("");
      setEmotionNeutral();
      clearAvatarCue();
      setAvatarState("idle");
      if (next.clearMessages !== false) {
        setMessages([]);
      }
    },
    [
      clearAvatarCue,
      lastFollowupCountRef,
      setAnswerText,
      setAvatarState,
      setEmotionNeutral,
      setFollowupCount,
      setIsQuestionStreaming,
      setMessages,
      setQuestionOrder,
      setStreamingQuestionText
    ]
  );

  return { handlePause, resetRoomState };
}
