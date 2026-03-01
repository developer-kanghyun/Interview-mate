"use client";

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useInterviewRoomFlow } from "@/features/interview-session/model/useInterviewRoomFlow";
import { useInterviewReportInsights } from "@/features/interview-session/model/useInterviewReportInsights";
import { useInterviewRoomCompletion } from "@/features/interview-session/model/useInterviewRoomCompletion";
import { buildRetryPreset } from "@/features/interview-session/model/interviewShell.utils";
import { resolveAvatarReportState } from "@/entities/avatar/model/avatarBehaviorMachine";
import type { StartInterviewPayload } from "@/features/interview-session/model/application/interviewSessionUseCases";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";
import type { ShowToast, UseInterviewRoomFlowResult } from "@/features/interview-session/model/interviewRoom.types";

type UseInterviewShellRoomReportFlowsOptions = {
  step: InterviewStep;
  setupPayload: StartInterviewPayload;
  sessionId: string | null;
  uiError: string | null;
  isGuestUser: boolean;
  isExiting: boolean;
  isResumeResolving: boolean;
  showToast: ShowToast;
  showToastError: (message: string, dedupeKey?: string) => void;
  setUiError: Dispatch<SetStateAction<string | null>>;
  setAuthPromptReason: (next: "auth_required" | null) => void;
  setStep: Dispatch<SetStateAction<InterviewStep>>;
  syncPathname: (nextPath: string, mode?: "push" | "replace") => void;
  setSetupPayload: Dispatch<SetStateAction<StartInterviewPayload>>;
  isStarting: boolean;
  setIsExiting: (next: boolean) => void;
  beginInterviewRef: MutableRefObject<(payload: StartInterviewPayload) => Promise<void>>;
  setPendingCompletedSessionId: Dispatch<SetStateAction<string | null>>;
  startQuestionStreamRef: MutableRefObject<((sessionId: string) => void) | null>;
};

type UseInterviewShellRoomReportFlowsResult = {
  roomFlow: UseInterviewRoomFlowResult;
  reportFlow: ReturnType<typeof useInterviewReportInsights>;
  moveToReport: (targetSessionId: string) => Promise<void>;
};

export function useInterviewShellRoomReportFlows({
  step,
  setupPayload,
  sessionId,
  uiError,
  isGuestUser,
  isExiting,
  isResumeResolving,
  showToast,
  showToastError,
  setUiError,
  setAuthPromptReason,
  setStep,
  syncPathname,
  setSetupPayload,
  isStarting,
  setIsExiting,
  beginInterviewRef,
  setPendingCompletedSessionId,
  startQuestionStreamRef
}: UseInterviewShellRoomReportFlowsOptions): UseInterviewShellRoomReportFlowsResult {
  const handleRoomSessionComplete = useInterviewRoomCompletion({
    setStep,
    syncPathname,
    setAuthPromptReason,
    setUiError,
    setPendingCompletedSessionId
  });

  const roomFlow = useInterviewRoomFlow({
    step,
    setupPayload,
    sessionId,
    uiError,
    isGuestUser,
    isExiting,
    isResumeResolving,
    showToast,
    showToastError,
    onSessionComplete: handleRoomSessionComplete,
    setUiError,
    setAuthPromptReason
  });
  startQuestionStreamRef.current = roomFlow.startQuestionStream;

  const reportFlow = useInterviewReportInsights({
    sessionId,
    setupPayload,
    setSetupPayload,
    setStep,
    syncPathname,
    isStarting,
    isExiting,
    setIsExiting,
    setUiError,
    setAuthPromptReason,
    showToastError,
    onBeforeMoveToReport: () => {
      roomFlow.stopRecording();
      roomFlow.stopQuestionStream();
      roomFlow.stopTtsPlayback();
    },
    onReportResolved: (nextReport) => {
      roomFlow.clearAvatarCue();
      roomFlow.setAvatarState(resolveAvatarReportState(nextReport.totalScore));
    },
    onRetryInterview: async (payload) => {
      await beginInterviewRef.current(payload);
    },
    buildRetryPreset
  });

  return {
    roomFlow,
    reportFlow,
    moveToReport: reportFlow.moveToReport
  };
}
