"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

type UseInterviewUiRecoveryOptions = {
  step: InterviewStep;
  sessionId: string | null;
  setUiError: Dispatch<SetStateAction<string | null>>;
  setAuthPromptReason: (next: "auth_required" | null) => void;
  moveToReport: (targetSessionId: string) => Promise<void>;
  handleGoInsights: () => Promise<void>;
  runBackendHealthCheck: () => Promise<void>;
};

export function useInterviewUiRecovery({
  step,
  sessionId,
  setUiError,
  setAuthPromptReason,
  moveToReport,
  handleGoInsights,
  runBackendHealthCheck
}: UseInterviewUiRecoveryOptions) {
  const clearUiError = useCallback(() => {
    setUiError(null);
    setAuthPromptReason(null);
  }, [setAuthPromptReason, setUiError]);

  const handleRetryUiError = useCallback(async () => {
    setUiError(null);
    setAuthPromptReason(null);
    if (step === "report" && sessionId) {
      await moveToReport(sessionId);
      return;
    }
    if (step === "insights") {
      await handleGoInsights();
      return;
    }
    await runBackendHealthCheck();
  }, [handleGoInsights, moveToReport, runBackendHealthCheck, sessionId, setAuthPromptReason, setUiError, step]);

  return {
    clearUiError,
    handleRetryUiError
  };
}
