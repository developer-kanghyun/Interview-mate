"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { buildInterviewShellState } from "@/features/interview-session/model/interviewShell.presenter";
import { useInterviewShellBootstrapEffects } from "@/features/interview-session/model/useInterviewShellBootstrapEffects";
import { useStartSession } from "@/features/interview/start-session/model/useStartSession";
import { useInterviewResumeActions } from "@/features/interview-session/model/useInterviewResumeActions";
import { useInterviewShellNavigation } from "@/features/interview-session/model/useInterviewShellNavigation";
import { useInterviewShellToast } from "@/features/interview-session/model/useInterviewShellToast";
import { useInterviewUiRecovery } from "@/features/interview-session/model/useInterviewUiRecovery";
import { useToast } from "@/shared/ui/toast/useToast";
import type { UseInterviewShellStateOptions, UseInterviewShellStateResult } from "@/features/interview-session/model/interviewShell.types";
import { useInterviewShellCoreState } from "@/features/interview-session/model/useInterviewShellCoreState";
import { useInterviewShellSessionFlow } from "@/features/interview-session/model/useInterviewShellSessionFlow";
import { useInterviewShellBackendHealth } from "@/features/interview-session/model/useInterviewShellBackendHealth";
import { useInterviewShellAccessState } from "@/features/interview-session/model/useInterviewShellAccessState";
import { useInterviewShellRoomReportFlows } from "@/features/interview-session/model/useInterviewShellRoomReportFlows";
import { buildInterviewShellPresenterArgs } from "@/features/interview-session/model/interviewShell.presenter-args";

export type { UseInterviewShellStateOptions, UseInterviewShellStateResult };

export function useInterviewShellOrchestrator(options: UseInterviewShellStateOptions = {}): UseInterviewShellStateResult {
  const pathname = usePathname();
  const { pushToast } = useToast();
  const {
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
  } = useInterviewShellCoreState({ pathname, options });
  const { syncPathname, updateStep } = useInterviewShellNavigation(sessionId, setStep);
  const { showToast, showToastError } = useInterviewShellToast(pushToast);
  const {
    resumeCandidateSessionId,
    isResumePromptOpen,
    isResumeCandidateGuest,
    isResumeResolving,
    setIsResumePromptOpen,
    setIsResumeResolving,
    handleDismissResumeCandidate,
    resetResumeState,
    authStatus,
    isAuthLoading,
    isGuestUser,
    isMemberAuthenticated: isMemberAuthenticatedBase,
    isAuthRequired,
    authRedirectTarget,
    setAuthPromptReason,
    handleGoogleLogin,
    handleGoogleLogout,
    retryAuthBootstrap
  } = useInterviewShellAccessState({
    routeSessionId,
    routeStep,
    step,
    sessionId,
    showToastError,
    setUiError
  });
  const runBackendHealthCheck = useInterviewShellBackendHealth({ setBackendStatus, setBackendStatusMessage });
  const { isStarting, startSession, startError, clearStartError } = useStartSession();
  const [pendingCompletedSessionId, setPendingCompletedSessionId] = useState<string | null>(null);
  const { roomFlow, reportFlow, moveToReport } = useInterviewShellRoomReportFlows({
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
  });
  const resetRoomState = roomFlow.resetRoomState;
  const startRoomQuestionStream = roomFlow.startQuestionStream;
  const { restoreSessionIntoRoom, handleContinueResumeCandidate } = useInterviewResumeActions({
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
    resetReportState: reportFlow.resetReportState,
    resetResumeState,
    showToastError,
    syncPathname,
    startQuestionStreamRef
  });
  useInterviewShellBootstrapEffects({
    runBackendHealthCheck,
    startError,
    showToastError,
    setSetupPayload,
    step,
    sessionId,
    isResumeResolving,
    restoreSessionIntoRoom,
    autoRestoreAttemptedSessionRef
  });
  const { beginInterview, handleStartInterview, handleExit } = useInterviewShellSessionFlow({
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
    clearReportFetchError: reportFlow.clearReportFetchError,
    setIsExiting,
    resetResumeState,
    clearStartError,
    startSession,
    autoRestoreAttemptedSessionRef,
    setSessionId,
    resetReportState: reportFlow.resetReportState,
    resetRoomState,
    startRoomQuestionStream
  });
  beginInterviewRef.current = beginInterview;
  const { clearUiError, handleRetryUiError } = useInterviewUiRecovery({
    step,
    sessionId,
    setUiError,
    setAuthPromptReason,
    moveToReport,
    handleGoInsights: reportFlow.handleGoInsights,
    runBackendHealthCheck
  });
  return buildInterviewShellState(buildInterviewShellPresenterArgs({
    step,
    updateStep,
    uiError,
    clearUiError,
    handleRetryUiError,
    authStatus,
    isMemberAuthenticatedBase,
    isAuthRequired,
    authRedirectTarget,
    handleGoogleLogin,
    handleGoogleLogout,
    isAuthLoading,
    backendStatus,
    backendStatusMessage,
    runBackendHealthCheck,
    setupPayload,
    setSetupPayload,
    isStarting,
    sessionId,
    roomFlow,
    reportFlow,
    handleStartInterview,
    handleExit,
    isExiting,
    resumeCandidateSessionId,
    isResumePromptOpen,
    isResumeCandidateGuest,
    isResumeResolving,
    handleContinueResumeCandidate,
    handleDismissResumeCandidate
  }));
}
