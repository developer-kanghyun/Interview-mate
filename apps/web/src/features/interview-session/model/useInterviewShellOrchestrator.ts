"use client";

import {
  useCallback,
  useMemo,
  useState
} from "react";
import { usePathname } from "next/navigation";
import {
  pingBackendHealth,
  type StartInterviewPayload
} from "@/shared/api/interview-client";
import { useInterviewAuthState } from "@/features/interview-session/model/useInterviewAuthState";
import { buildInterviewShellState } from "@/features/interview-session/model/interviewShell.presenter";
import { useInterviewShellBootstrapEffects } from "@/features/interview-session/model/useInterviewShellBootstrapEffects";
import { useInterviewResumeState } from "@/features/interview-session/model/useInterviewResumeState";
import { useInterviewRoomFlow } from "@/features/interview-session/model/useInterviewRoomFlow";
import { useInterviewReportInsights } from "@/features/interview-session/model/useInterviewReportInsights";
import { useStartSession } from "@/features/interview/start-session/model/useStartSession";
import { useInterviewResumeActions } from "@/features/interview-session/model/useInterviewResumeActions";
import { useInterviewShellNavigation } from "@/features/interview-session/model/useInterviewShellNavigation";
import { useInterviewShellToast } from "@/features/interview-session/model/useInterviewShellToast";
import { useInterviewUiRecovery } from "@/features/interview-session/model/useInterviewUiRecovery";
import {
  buildRetryPreset
} from "@/features/interview-session/model/interviewShell.utils";
import {
  resolveAvatarReportState
} from "@/entities/avatar/model/avatarBehaviorMachine";
import { useToast } from "@/shared/ui/toast/useToast";
import type {
  UseInterviewShellStateOptions,
  UseInterviewShellStateResult
} from "@/features/interview-session/model/interviewShell.types";
import { useInterviewShellCoreState } from "@/features/interview-session/model/useInterviewShellCoreState";
import { useInterviewShellSessionFlow } from "@/features/interview-session/model/useInterviewShellSessionFlow";

export type { UseInterviewShellStateOptions, UseInterviewShellStateResult };

export function useInterviewShellOrchestrator(
  options: UseInterviewShellStateOptions = {}
): UseInterviewShellStateResult {
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

  const updateSetupPayload = useCallback((next: StartInterviewPayload) => {
    setSetupPayload(next);
  }, [setSetupPayload]);
  const { showToast, showToastError } = useInterviewShellToast(pushToast);

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
    isMemberAuthenticated: isMemberAuthenticatedBase,
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

  const runBackendHealthCheck = useCallback(async () => {
    setBackendStatus("checking");
    setBackendStatusMessage(null);
    try {
      await pingBackendHealth();
      setBackendStatus("ok");
    } catch (error) {
      const message = error instanceof Error ? error.message : "백엔드 연결 확인에 실패했습니다.";
      setBackendStatus("error");
      setBackendStatusMessage(message);
    }
  }, [setBackendStatus, setBackendStatusMessage]);

  const { isStarting, startSession, startError, clearStartError } = useStartSession();
  const [pendingCompletedSessionId, setPendingCompletedSessionId] = useState<string | null>(null);

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
    onSessionComplete: async (targetSessionId, guest) => {
      if (guest) {
        setStep("report");
        syncPathname(`/report/${encodeURIComponent(targetSessionId)}`);
        setAuthPromptReason("auth_required");
        setUiError(null);
        return;
      }
      setPendingCompletedSessionId(targetSessionId);
    },
    setUiError,
    setAuthPromptReason
  });
  const resetRoomState = roomFlow.resetRoomState;
  const startRoomQuestionStream = roomFlow.startQuestionStream;
  const stopRoomRecording = roomFlow.stopRecording;
  const stopRoomQuestionStream = roomFlow.stopQuestionStream;
  const stopRoomTtsPlayback = roomFlow.stopTtsPlayback;
  const clearRoomAvatarCue = roomFlow.clearAvatarCue;
  const setRoomAvatarState = roomFlow.setAvatarState;
  startQuestionStreamRef.current = startRoomQuestionStream;

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
      stopRoomRecording();
      stopRoomQuestionStream();
      stopRoomTtsPlayback();
    },
    onReportResolved: (nextReport) => {
      clearRoomAvatarCue();
      setRoomAvatarState(resolveAvatarReportState(nextReport.totalScore));
    },
    onRetryInterview: async (payload) => {
      await beginInterviewRef.current(payload);
    },
    buildRetryPreset
  });
  const moveToReport = reportFlow.moveToReport;
  const handleGoInsights = reportFlow.handleGoInsights;
  const clearReportFetchError = reportFlow.clearReportFetchError;
  const resetReportState = reportFlow.resetReportState;
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
    resetReportState,
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
  });
  beginInterviewRef.current = beginInterview;
  const { clearUiError, handleRetryUiError } = useInterviewUiRecovery({
    step,
    sessionId,
    setUiError,
    setAuthPromptReason,
    moveToReport,
    handleGoInsights,
    runBackendHealthCheck
  });
  const isMemberAuthenticated = useMemo(
    () => isMemberAuthenticatedBase && reportFlow.reportErrorCode !== "auth_required",
    [isMemberAuthenticatedBase, reportFlow.reportErrorCode]
  );
  const weakKeywords = reportFlow.weakKeywords;
  const studyGuide = reportFlow.studyGuide;
  const questionGuides = reportFlow.questionGuides;

  return buildInterviewShellState({
    step,
    updateStep,
    uiError,
    clearUiError,
    handleRetryUiError,
    authStatus,
    isMemberAuthenticated,
    isAuthRequired,
    reportErrorCode: reportFlow.reportErrorCode,
    authRedirectTarget,
    handleGoogleLogin,
    handleGoogleLogout,
    isAuthLoading,
    backendStatus,
    backendStatusMessage,
    runBackendHealthCheck,
    setupPayload,
    setSetupPayload: updateSetupPayload,
    isStarting,
    sessionId,
    avatarState: roomFlow.avatarState,
    avatarCueToken: roomFlow.avatarCueToken,
    emotion: roomFlow.emotion,
    ttsAudioRef: roomFlow.ttsAudioRef,
    isAutoplayBlocked: roomFlow.isAutoplayBlocked,
    playTtsAudio: roomFlow.playTtsAudio,
    isRecording: roomFlow.isRecording,
    isSttSupported: roomFlow.isSttSupported,
    isSttBusy: roomFlow.isSttBusy,
    handleToggleRecording: roomFlow.handleToggleRecording,
    questionOrder: roomFlow.questionOrder,
    followupCount: roomFlow.followupCount,
    streamingQuestionText: roomFlow.streamingQuestionText,
    isQuestionStreaming: roomFlow.isQuestionStreaming,
    messages: roomFlow.messages,
    answerText: roomFlow.answerText,
    setAnswerText: roomFlow.setAnswerText,
    isSubmitting: roomFlow.isSubmitting,
    handleStartInterview,
    handleSubmitAnswer: roomFlow.handleSubmitAnswer,
    handlePause: roomFlow.handlePause,
    handleExit,
    isExiting,
    report: reportFlow.report,
    isReportLoading: reportFlow.isReportLoading,
    reportErrorMessage: reportFlow.reportErrorMessage,
    handleRetryReport: reportFlow.handleRetryReport,
    handleGoInsights,
    isInsightsLoading: reportFlow.isInsightsLoading,
    insightsErrorMessage: reportFlow.insightsErrorMessage,
    sessions: reportFlow.sessions,
    weakKeywords,
    studyGuide,
    questionGuides,
    isRetryingWeakness: reportFlow.isRetryingWeakness,
    handleRetryWeakness: reportFlow.handleRetryWeakness,
    resumeCandidateSessionId,
    isResumePromptOpen,
    isResumeCandidateGuest,
    isResumeResolving,
    handleContinueResumeCandidate,
    handleDismissResumeCandidate
  });
}
