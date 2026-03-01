"use client";

import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { hasInterviewRuntimeState, type StartInterviewPayload } from "@/shared/api/interview-client";
import { getInterviewPreferences } from "@/shared/config/interview-preferences";
import { clearLegacyApiKeyStorage } from "@/shared/auth/session";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

type UseInterviewShellBootstrapEffectsOptions = {
  runBackendHealthCheck: () => Promise<void>;
  startError: string | null;
  showToastError: (message: string, dedupeKey?: string) => void;
  setSetupPayload: Dispatch<SetStateAction<StartInterviewPayload>>;
  step: InterviewStep;
  sessionId: string | null;
  isResumeResolving: boolean;
  restoreSessionIntoRoom: (sessionId: string) => Promise<void>;
  autoRestoreAttemptedSessionRef: MutableRefObject<string | null>;
};

export function useInterviewShellBootstrapEffects({
  runBackendHealthCheck,
  startError,
  showToastError,
  setSetupPayload,
  step,
  sessionId,
  isResumeResolving,
  restoreSessionIntoRoom,
  autoRestoreAttemptedSessionRef
}: UseInterviewShellBootstrapEffectsOptions) {
  useEffect(() => {
    void runBackendHealthCheck();
  }, [runBackendHealthCheck]);

  useEffect(() => {
    if (!startError) {
      return;
    }
    showToastError(startError, `start:${startError}`);
  }, [showToastError, startError]);

  useEffect(() => {
    clearLegacyApiKeyStorage();
  }, []);

  useEffect(() => {
    const savedPreferences = getInterviewPreferences();
    if (!savedPreferences) {
      return;
    }
    setSetupPayload((previous) => ({
      ...previous,
      ...savedPreferences
    }));
  }, [setSetupPayload]);

  useEffect(() => {
    if (step !== "room" || !sessionId || isResumeResolving) {
      return;
    }
    if (hasInterviewRuntimeState(sessionId)) {
      return;
    }
    if (autoRestoreAttemptedSessionRef.current === sessionId) {
      return;
    }
    autoRestoreAttemptedSessionRef.current = sessionId;
    void restoreSessionIntoRoom(sessionId);
  }, [autoRestoreAttemptedSessionRef, isResumeResolving, restoreSessionIntoRoom, sessionId, step]);
}
