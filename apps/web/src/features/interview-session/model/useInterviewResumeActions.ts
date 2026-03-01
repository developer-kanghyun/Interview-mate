"use client";

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { getInterviewSessionState } from "@/shared/api/interview";
import { restoreInterviewSession, type StartInterviewPayload } from "@/shared/api/interview-client";
import { clearStoredSessionId } from "@/shared/auth/session";
import { buildSetupPayloadFromSessionState } from "@/features/interview-session/model/interviewShell.utils";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

type UseInterviewResumeActionsOptions = {
  resumeCandidateSessionId: string | null;
  isResumeResolving: boolean;
  isResumeCandidateGuest: boolean;
  setIsResumeResolving: (next: boolean) => void;
  setIsResumePromptOpen: (next: boolean) => void;
  handleGoogleLogin: (redirectTo?: string) => Promise<void>;
  setUiError: Dispatch<SetStateAction<string | null>>;
  setStep: Dispatch<SetStateAction<InterviewStep>>;
  setSessionId: Dispatch<SetStateAction<string | null>>;
  setSetupPayload: Dispatch<SetStateAction<StartInterviewPayload>>;
  resetRoomState: (next: { questionOrder: number; followupCount: number; clearMessages?: boolean }) => void;
  resetReportState: () => void;
  resetResumeState: () => void;
  showToastError: (message: string, dedupeKey?: string) => void;
  syncPathname: (nextPath: string, mode?: "push" | "replace") => void;
  startQuestionStreamRef: MutableRefObject<((sessionId: string) => void) | null>;
};

export function useInterviewResumeActions({
  resumeCandidateSessionId,
  isResumeResolving,
  isResumeCandidateGuest,
  setIsResumeResolving,
  setIsResumePromptOpen,
  handleGoogleLogin,
  setUiError,
  setStep,
  setSessionId,
  setSetupPayload,
  resetRoomState,
  resetReportState,
  resetResumeState,
  showToastError,
  syncPathname,
  startQuestionStreamRef
}: UseInterviewResumeActionsOptions) {
  const restoreSessionIntoRoom = useCallback(
    async (
      targetSessionId: string,
      options?: {
        stepFallbackMessage?: string;
      }
    ) => {
      setIsResumeResolving(true);
      setUiError(null);

      try {
        const stateResponse = await getInterviewSessionState(targetSessionId);
        const state = stateResponse.data;
        if (state.status !== "in_progress" || !state.current_question) {
          throw new Error("재개 가능한 진행중 세션이 없습니다. 새 면접을 시작해 주세요.");
        }

        await restoreInterviewSession(targetSessionId);

        setSessionId(targetSessionId);
        setSetupPayload(buildSetupPayloadFromSessionState(state));
        resetRoomState({
          questionOrder: state.current_question.question_order,
          followupCount: state.current_question.followup_count,
          clearMessages: true
        });
        resetReportState();
        setStep("room");
        syncPathname(`/interview/${encodeURIComponent(targetSessionId)}`, "replace");
        startQuestionStreamRef.current?.(targetSessionId);
        clearStoredSessionId();
        resetResumeState();
      } catch (error) {
        const fallbackMessage = options?.stepFallbackMessage ?? "이전 세션 재개에 실패했습니다. 새 면접을 시작해 주세요.";
        const message = error instanceof Error ? error.message : fallbackMessage;
        setStep("setup");
        syncPathname("/setup", "replace");
        resetResumeState();
        showToastError(message || fallbackMessage, "resume:restore-failed");
      } finally {
        setIsResumeResolving(false);
      }
    },
    [
      resetReportState,
      resetResumeState,
      resetRoomState,
      setIsResumeResolving,
      setSessionId,
      setSetupPayload,
      setStep,
      setUiError,
      showToastError,
      startQuestionStreamRef,
      syncPathname
    ]
  );

  const handleContinueResumeCandidate = useCallback(async () => {
    if (!resumeCandidateSessionId || isResumeResolving) {
      return;
    }

    if (isResumeCandidateGuest) {
      setIsResumeResolving(true);
      setIsResumePromptOpen(false);
      try {
        await handleGoogleLogin(`/interview/${encodeURIComponent(resumeCandidateSessionId)}`);
      } finally {
        setIsResumeResolving(false);
      }
      return;
    }

    await restoreSessionIntoRoom(resumeCandidateSessionId);
  }, [
    handleGoogleLogin,
    isResumeCandidateGuest,
    isResumeResolving,
    restoreSessionIntoRoom,
    resumeCandidateSessionId,
    setIsResumePromptOpen,
    setIsResumeResolving
  ]);

  return {
    restoreSessionIntoRoom,
    handleContinueResumeCandidate
  };
}
