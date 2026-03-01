"use client";

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import {
  submitInterviewAnswerUseCase,
  type InterviewEmotion
} from "@/features/interview-session/model/application/interviewSessionUseCases";
import type { ChatMessage } from "@/shared/chat/ChatBoard";
import {
  resolveAvatarTransientStateFromAnswer,
  type AvatarState,
  type AvatarTransientState
} from "@/entities/avatar/model/avatarBehaviorMachine";
import { getAuthRequiredMessage } from "@/shared/auth/session";
import {
  buildCoachContent,
  createAnswerErrorMessage,
  createCoachFeedbackMessage,
  createUserAnswerMessage,
  isCoachWarning
} from "@/features/interview-session/model/interviewRoom.utils";

type ToastVariant = "info" | "success" | "warning" | "error";
type ShowToast = (options: {
  message: string;
  variant?: ToastVariant;
  dedupeKey?: string;
  title?: string;
}) => void;

export type SubmitAnswerOptions = {
  answerOverride?: string;
  inputType?: "text" | "voice";
};

type UseInterviewSubmitAnswerOptions = {
  sessionId: string | null;
  answerText: string;
  isSubmitting: boolean;
  isResumeResolving: boolean;
  isGuestUser: boolean;
  setAnswerText: Dispatch<SetStateAction<string>>;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
  setAvatarState: Dispatch<SetStateAction<AvatarState>>;
  setEmotion: Dispatch<SetStateAction<InterviewEmotion>>;
  setFollowupCount: Dispatch<SetStateAction<number>>;
  setUiError: Dispatch<SetStateAction<string | null>>;
  setAuthPromptReason: (next: "auth_required" | null) => void;
  lastFollowupCountRef: MutableRefObject<number>;
  appendMessage: (nextMessage: ChatMessage) => void;
  clearAvatarCue: () => void;
  triggerAvatarCue: (cue: AvatarTransientState) => void;
  showToast: ShowToast;
  showToastError: (message: string, dedupeKey?: string) => void;
  startQuestionStream: (targetSessionId: string) => void;
  stopQuestionStream: () => void;
  stopTtsPlayback: () => void;
  onSessionComplete: (targetSessionId: string, isGuestUser: boolean) => Promise<void> | void;
};

export function useInterviewSubmitAnswer({
  sessionId,
  answerText,
  isSubmitting,
  isResumeResolving,
  isGuestUser,
  setAnswerText,
  setIsSubmitting,
  setAvatarState,
  setEmotion,
  setFollowupCount,
  setUiError,
  setAuthPromptReason,
  lastFollowupCountRef,
  appendMessage,
  clearAvatarCue,
  triggerAvatarCue,
  showToast,
  showToastError,
  startQuestionStream,
  stopQuestionStream,
  stopTtsPlayback,
  onSessionComplete
}: UseInterviewSubmitAnswerOptions) {
  return useCallback(
    async (options?: SubmitAnswerOptions) => {
      const inputType = options?.inputType ?? "text";
      const sourceAnswer = options?.answerOverride ?? answerText;
      if (!sessionId || !sourceAnswer.trim() || isSubmitting || isResumeResolving) {
        return;
      }

      const submittedAnswer = sourceAnswer.trim();
      appendMessage(createUserAnswerMessage(submittedAnswer));

      setAnswerText("");
      setIsSubmitting(true);
      setAvatarState("thinking");
      setUiError(null);

      try {
        const response = await submitInterviewAnswerUseCase(sessionId, submittedAnswer, inputType);
        const previousFollowupCount = lastFollowupCountRef.current;
        setEmotion(response.suggestedEmotion);
        setFollowupCount(response.followupCount);
        lastFollowupCountRef.current = response.followupCount;

        const nextCue = resolveAvatarTransientStateFromAnswer({
          previousFollowupCount,
          nextFollowupCount: response.followupCount,
          totalScore: response.totalScore,
          suggestedEmotion: response.suggestedEmotion
        });

        if (nextCue) {
          triggerAvatarCue(nextCue);
        } else {
          clearAvatarCue();
        }

        const needsCoachWarning = isCoachWarning(response.totalScore);
        const coachContent = buildCoachContent(response.feedbackSummary, response.coaching);

        if (coachContent) {
          appendMessage(createCoachFeedbackMessage(coachContent, needsCoachWarning));
        } else if (!response.coachingAvailable) {
          showToast({
            message: "코칭 생성이 지연되었습니다. 다음 답변으로 진행해 주세요.",
            variant: "info",
            dedupeKey: "coach:unavailable"
          });
        }

        if (response.isSessionComplete) {
          if (isGuestUser) {
            stopQuestionStream();
            stopTtsPlayback();
          }
          await onSessionComplete(sessionId, isGuestUser);
          return;
        }

        startQuestionStream(sessionId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "답변 제출에 실패했습니다.";
        if (message === getAuthRequiredMessage()) {
          setAuthPromptReason("auth_required");
          setUiError(message);
        } else {
          setAuthPromptReason(null);
          showToastError(message, "answer:submit");
        }
        setAnswerText(submittedAnswer);
        setAvatarState("listening");
        appendMessage(createAnswerErrorMessage(message));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      answerText,
      appendMessage,
      clearAvatarCue,
      isGuestUser,
      isResumeResolving,
      isSubmitting,
      lastFollowupCountRef,
      onSessionComplete,
      sessionId,
      setAnswerText,
      setAuthPromptReason,
      setAvatarState,
      setEmotion,
      setFollowupCount,
      setIsSubmitting,
      setUiError,
      showToast,
      showToastError,
      startQuestionStream,
      stopQuestionStream,
      stopTtsPlayback,
      triggerAvatarCue
    ]
  );
}
