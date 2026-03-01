"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { defaultSetupPayload, type InterviewStep } from "@/features/interview-session/model/interviewSession.constants";
import {
  resolveSessionIdFromPath,
  resolveStepFromPath
} from "@/features/interview-session/model/interviewShell.utils";
import type { StartInterviewPayload } from "@/features/interview-session/model/application/interviewSessionUseCases";
import type { UseInterviewShellStateOptions } from "@/features/interview-session/model/interviewShell.types";

type UseInterviewShellCoreStateOptions = {
  pathname: string;
  options: UseInterviewShellStateOptions;
};

export function useInterviewShellCoreState({ pathname, options }: UseInterviewShellCoreStateOptions) {
  const [step, setStep] = useState<InterviewStep>("setup");
  const [setupPayload, setSetupPayload] = useState<StartInterviewPayload>(defaultSetupPayload);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "ok" | "error">("checking");
  const [backendStatusMessage, setBackendStatusMessage] = useState<string | null>(null);
  const autoRestoreAttemptedSessionRef = useRef<string | null>(null);
  const startQuestionStreamRef = useRef<((sessionId: string) => void) | null>(null);
  const beginInterviewRef = useRef<(payload: StartInterviewPayload) => Promise<void>>(async () => {});

  const routeStep = useMemo(
    () => options.initialStep ?? resolveStepFromPath(pathname),
    [options.initialStep, pathname]
  );
  const routeSessionId = useMemo(
    () => options.initialSessionId ?? resolveSessionIdFromPath(pathname),
    [options.initialSessionId, pathname]
  );

  useEffect(() => {
    if (!routeStep) {
      return;
    }
    setStep((current) => (current === routeStep ? current : routeStep));
  }, [routeStep]);

  useEffect(() => {
    if (!routeSessionId) {
      return;
    }
    setSessionId((current) => (current === routeSessionId ? current : routeSessionId));
  }, [routeSessionId]);

  useEffect(() => {
    if (step === "room") {
      return;
    }
    autoRestoreAttemptedSessionRef.current = null;
  }, [step]);

  return {
    step,
    setStep,
    setupPayload,
    setSetupPayload,
    sessionId,
    setSessionId,
    isExiting,
    setIsExiting,
    uiError,
    setUiError,
    backendStatus,
    setBackendStatus,
    backendStatusMessage,
    setBackendStatusMessage,
    autoRestoreAttemptedSessionRef,
    startQuestionStreamRef,
    beginInterviewRef,
    routeStep,
    routeSessionId
  };
}
