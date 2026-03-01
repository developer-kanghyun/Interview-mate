"use client";

import type { Dispatch, SetStateAction } from "react";
import { useInterviewAuthState } from "@/features/interview-session/model/useInterviewAuthState";
import { useInterviewResumeState } from "@/features/interview-session/model/useInterviewResumeState";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

type UseInterviewShellAccessStateOptions = {
  routeSessionId: string | null;
  routeStep: InterviewStep | null;
  step: InterviewStep;
  sessionId: string | null;
  showToastError: (message: string, dedupeKey?: string) => void;
  setUiError: Dispatch<SetStateAction<string | null>>;
};

export function useInterviewShellAccessState({
  routeSessionId,
  routeStep,
  step,
  sessionId,
  showToastError,
  setUiError
}: UseInterviewShellAccessStateOptions) {
  const {
    resumeCandidateSessionId,
    isResumePromptOpen,
    isResumeCandidateGuest,
    isResumeResolving,
    setIsResumePromptOpen,
    setIsResumeResolving,
    syncResumeCandidate,
    handleDismissResumeCandidate,
    resetResumeState
  } = useInterviewResumeState({
    routeSessionId,
    routeStep,
    step,
    showToastError
  });

  const {
    authStatus,
    authPromptReason,
    isAuthLoading,
    isGuestUser,
    isMemberAuthenticated,
    isAuthRequired,
    authRedirectTarget,
    setAuthPromptReason,
    handleGoogleLogin,
    handleGoogleLogout,
    retryAuthBootstrap
  } = useInterviewAuthState({
    step,
    sessionId,
    showToastError,
    setUiError,
    onSyncResumeCandidate: syncResumeCandidate,
    onResetResumeState: resetResumeState
  });

  return {
    resumeCandidateSessionId,
    isResumePromptOpen,
    isResumeCandidateGuest,
    isResumeResolving,
    setIsResumePromptOpen,
    setIsResumeResolving,
    handleDismissResumeCandidate,
    resetResumeState,
    authStatus,
    authPromptReason,
    isAuthLoading,
    isGuestUser,
    isMemberAuthenticated,
    isAuthRequired,
    authRedirectTarget,
    setAuthPromptReason,
    handleGoogleLogin,
    handleGoogleLogout,
    retryAuthBootstrap
  };
}
