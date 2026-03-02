"use client";

import { useCallback, useEffect } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type {
  StartInterviewPayload,
  StartInterviewResponse
} from "@/features/interview/start-session/model/application/startInterviewSessionUseCase";
import {
  clearStoredSessionId,
  setStoredSessionId
} from "@/shared/auth/session";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

type AuthStatus = "loading" | "member" | "guest" | "anonymous" | "error";

type UseInterviewShellSessionFlowOptions = {
  authStatus: AuthStatus;
  retryAuthBootstrap: () => Promise<boolean>;
  setupPayload: StartInterviewPayload;
  showToastError: (message: string, dedupeKey?: string) => void;
  pendingCompletedSessionId: string | null;
  setPendingCompletedSessionId: Dispatch<SetStateAction<string | null>>;
  isExiting: boolean;
  isResumeResolving: boolean;
  sessionId: string | null;
  moveToReport: (targetSessionId: string) => Promise<void>;
  setStep: (next: InterviewStep) => void;
  syncPathname: (nextPath: string, mode?: "push" | "replace") => void;
  setUiError: Dispatch<SetStateAction<string | null>>;
  setAuthPromptReason: (next: "auth_required" | null) => void;
  clearReportFetchError: () => void;
  setIsExiting: (next: boolean) => void;
  resetResumeState: () => void;
  clearStartError: () => void;
  startSession: (payload: StartInterviewPayload) => Promise<StartInterviewResponse | null>;
  autoRestoreAttemptedSessionRef: MutableRefObject<string | null>;
  setSessionId: Dispatch<SetStateAction<string | null>>;
  resetReportState: () => void;
  resetRoomState: (next: {
    questionOrder: number;
    followupCount: number;
    clearMessages?: boolean;
  }) => void;
  startRoomQuestionStream: (targetSessionId: string) => void;
};

type UseInterviewShellSessionFlowResult = {
  beginInterview: (payload: StartInterviewPayload) => Promise<void>;
  handleStartInterview: () => Promise<void>;
  handleExit: () => Promise<void>;
};

export function useInterviewShellSessionFlow({
  authStatus,
  retryAuthBootstrap,
  setupPayload,
  showToastError,
  pendingCompletedSessionId,
  setPendingCompletedSessionId,
  isExiting,
  isResumeResolving,
  sessionId,
  moveToReport,
  setStep,
  syncPathname,
  setUiError,
  setAuthPromptReason,
  clearReportFetchError,
  setIsExiting,
  resetResumeState,
  clearStartError,
  startSession,
  autoRestoreAttemptedSessionRef,
  setSessionId,
  resetReportState,
  resetRoomState,
  startRoomQuestionStream
}: UseInterviewShellSessionFlowOptions): UseInterviewShellSessionFlowResult {
  const beginInterview = useCallback(
    async (payload: StartInterviewPayload) => {
      setUiError(null);
      setAuthPromptReason(null);
      clearReportFetchError();
      setIsExiting(false);
      resetResumeState();
      clearStartError();
      try {
        const started = await startSession(payload);
        if (!started) {
          return;
        }
        autoRestoreAttemptedSessionRef.current = started.sessionId;
        setStoredSessionId(started.sessionId);
        setSessionId(started.sessionId);
        resetReportState();
        resetRoomState({
          questionOrder: 1,
          followupCount: 0,
          clearMessages: true
        });
        setStep("room");
        syncPathname(`/interview/${encodeURIComponent(started.sessionId)}`);
        startRoomQuestionStream(started.sessionId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "면접 시작에 실패했습니다.";
        showToastError(message, "interview:start");
        clearStoredSessionId();
      }
    },
    [
      autoRestoreAttemptedSessionRef,
      clearStartError,
      clearReportFetchError,
      resetResumeState,
      resetRoomState,
      resetReportState,
      setIsExiting,
      setSessionId,
      setStep,
      setAuthPromptReason,
      setUiError,
      showToastError,
      startRoomQuestionStream,
      startSession,
      syncPathname
    ]
  );

  const handleStartInterview = useCallback(async () => {
    if (authStatus !== "member" && authStatus !== "guest") {
      const recovered = await retryAuthBootstrap();
      if (!recovered) {
        return;
      }
    }
    await beginInterview(setupPayload);
  }, [authStatus, beginInterview, retryAuthBootstrap, setupPayload]);

  useEffect(() => {
    if (!pendingCompletedSessionId || isExiting) {
      return;
    }

    void (async () => {
      try {
        await moveToReport(pendingCompletedSessionId);
      } finally {
        setPendingCompletedSessionId(null);
      }
    })();
  }, [isExiting, moveToReport, pendingCompletedSessionId, setPendingCompletedSessionId]);

  const handleExit = useCallback(async () => {
    if (isExiting || isResumeResolving) {
      return;
    }
    if (!sessionId) {
      clearStoredSessionId();
      syncPathname("/setup", "replace");
      setStep("setup");
      return;
    }
    await moveToReport(sessionId);
  }, [isExiting, isResumeResolving, moveToReport, sessionId, setStep, syncPathname]);

  return {
    beginInterview,
    handleStartInterview,
    handleExit
  };
}
