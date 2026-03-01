"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

type UseInterviewRoomCompletionOptions = {
  setStep: (next: InterviewStep) => void;
  syncPathname: (nextPath: string, mode?: "push" | "replace") => void;
  setAuthPromptReason: (next: "auth_required" | null) => void;
  setUiError: Dispatch<SetStateAction<string | null>>;
  setPendingCompletedSessionId: Dispatch<SetStateAction<string | null>>;
};

export function useInterviewRoomCompletion({
  setStep,
  syncPathname,
  setAuthPromptReason,
  setUiError,
  setPendingCompletedSessionId
}: UseInterviewRoomCompletionOptions) {
  return useCallback(
    async (targetSessionId: string, guest: boolean) => {
      if (guest) {
        setStep("report");
        syncPathname(`/report/${encodeURIComponent(targetSessionId)}`);
        setAuthPromptReason("auth_required");
        setUiError(null);
        return;
      }
      setPendingCompletedSessionId(targetSessionId);
    },
    [setAuthPromptReason, setPendingCompletedSessionId, setStep, setUiError, syncPathname]
  );
}
