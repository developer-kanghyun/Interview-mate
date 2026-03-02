"use client";

import { useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useToast } from "@/shared/ui/toast/useToast";
import { useInterviewShellCoreState } from "@/features/interview-session/model/useInterviewShellCoreState";
import { useInterviewShellNavigation } from "@/features/interview-session/model/useInterviewShellNavigation";
import { useInterviewShellToast } from "@/features/interview-session/model/useInterviewShellToast";
import { useInterviewShellAccessState } from "@/features/interview-session/model/useInterviewShellAccessState";
import { useInterviewShellBackendHealth } from "@/features/interview-session/model/useInterviewShellBackendHealth";
import { useStartSession } from "@/features/interview/start-session/model/useStartSession";
import { useInterviewResumeActions } from "@/features/interview-session/model/useInterviewResumeActions";
import { useInterviewShellBootstrapEffects } from "@/features/interview-session/model/useInterviewShellBootstrapEffects";
import { useInterviewReportInsights } from "@/features/interview-session/model/useInterviewReportInsights";
import { useInterviewShellSessionFlow } from "@/features/interview-session/model/useInterviewShellSessionFlow";
import { useInterviewUiRecovery } from "@/features/interview-session/model/useInterviewUiRecovery";
import { buildRetryPreset } from "@/features/interview-session/model/interviewShell.utils";
import type { UseInterviewShellStateOptions } from "@/features/interview-session/model/interviewShell.types";

export function useInterviewShellSurfaceState(options: UseInterviewShellStateOptions = {}) {
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
    routeStep,
    routeSessionId
  } = useInterviewShellCoreState({ pathname, options });
  const { syncPathname, updateStep } = useInterviewShellNavigation(sessionId, setStep);
  const { showToastError } = useInterviewShellToast(pushToast);
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
    isMemberAuthenticated,
    isAuthRequired,
    authRedirectTarget,
    setAuthPromptReason,
    handleGoogleLogin,
    handleGoogleLogout,
    retryAuthBootstrap
  } = useInterviewShellAccessState({ routeSessionId, routeStep, step, sessionId, showToastError, setUiError });
  const runBackendHealthCheck = useInterviewShellBackendHealth({ setBackendStatus, setBackendStatusMessage });
  const { isStarting, startSession, startError, clearStartError } = useStartSession();
  const [pendingCompletedSessionId, setPendingCompletedSessionId] = useState<string | null>(null);
  const noopResetRoomState = useRef(() => {
    return;
  });
  const noopStartStream = useRef(() => {
    return;
  });

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
    onBeforeMoveToReport: () => {},
    onReportResolved: () => {},
    onRetryInterview: async (payload) => {
      const started = await startSession(payload);
      if (!started) {
        return;
      }
      autoRestoreAttemptedSessionRef.current = started.sessionId;
      setSessionId(started.sessionId);
      syncPathname(`/interview/${encodeURIComponent(started.sessionId)}`);
    },
    buildRetryPreset
  });

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
    resetRoomState: () => noopResetRoomState.current(),
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

  const { beginInterview, handleStartInterview } = useInterviewShellSessionFlow({
    authStatus,
    retryAuthBootstrap,
    setupPayload,
    showToastError,
    pendingCompletedSessionId,
    setPendingCompletedSessionId,
    isExiting,
    isResumeResolving,
    sessionId,
    moveToReport: reportFlow.moveToReport,
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
    resetRoomState: () => noopResetRoomState.current(),
    startRoomQuestionStream: () => noopStartStream.current()
  });

  const { clearUiError, handleRetryUiError } = useInterviewUiRecovery({
    step,
    sessionId,
    setUiError,
    setAuthPromptReason,
    moveToReport: reportFlow.moveToReport,
    handleGoInsights: reportFlow.handleGoInsights,
    runBackendHealthCheck
  });

  const isNavigationBusy = useMemo(
    () =>
      isStarting ||
      reportFlow.isReportLoading ||
      reportFlow.isInsightsLoading ||
      reportFlow.isRetryingWeakness ||
      isExiting ||
      isAuthLoading ||
      isResumeResolving,
    [
      isAuthLoading,
      isExiting,
      isResumeResolving,
      isStarting,
      reportFlow.isInsightsLoading,
      reportFlow.isReportLoading,
      reportFlow.isRetryingWeakness
    ]
  );

  return {
    step,
    setStep: updateStep,
    uiError,
    clearUiError,
    handleRetryUiError,
    authStatus,
    isMemberAuthenticated: isMemberAuthenticated && reportFlow.reportErrorCode !== "auth_required",
    isAuthRequired,
    reportErrorCode: reportFlow.reportErrorCode,
    authRedirectTarget,
    handleGoogleLogin,
    handleGoogleLogout,
    isAuthLoading,
    backendStatus,
    backendStatusMessage,
    retryBackendHealthCheck: runBackendHealthCheck,
    setupPayload,
    setSetupPayload,
    isStarting,
    handleStartInterview,
    report: reportFlow.report,
    isReportLoading: reportFlow.isReportLoading,
    reportErrorMessage: reportFlow.reportErrorMessage,
    handleRetryReport: reportFlow.handleRetryReport,
    handleGoInsights: reportFlow.handleGoInsights,
    isInsightsLoading: reportFlow.isInsightsLoading,
    insightsErrorMessage: reportFlow.insightsErrorMessage,
    sessions: reportFlow.sessions,
    weakKeywords: reportFlow.weakKeywords,
    studyGuide: reportFlow.studyGuide,
    questionGuides: reportFlow.questionGuides,
    isRetryingWeakness: reportFlow.isRetryingWeakness,
    handleRetryWeakness: reportFlow.handleRetryWeakness,
    resumeCandidateSessionId,
    isResumePromptOpen,
    isResumeCandidateGuest,
    isResumeResolving,
    handleContinueResumeCandidate,
    handleDismissResumeCandidate,
    isNavigationBusy,
    beginInterview
  };
}
