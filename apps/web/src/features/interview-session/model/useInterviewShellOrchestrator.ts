"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject
} from "react";
import { usePathname } from "next/navigation";
import {
  hasInterviewRuntimeState,
  pingBackendHealth,
  type InterviewCharacter,
  type ReportQuestionGuide,
  type InterviewEmotion,
  type InterviewReport,
  type SessionHistoryItem,
  type StartInterviewPayload
} from "@/shared/api/interview-client";
import type { ChatMessage } from "@/shared/chat/ChatBoard";
import {
  defaultSetupPayload,
  interviewerNameMap,
  mapDifficultyLabel,
  mapRoleLabel,
  type InterviewStep
} from "@/features/interview-session/model/interviewSession.constants";
import { getInterviewPreferences } from "@/shared/config/interview-preferences";
import { useInterviewAuthState } from "@/features/interview-session/model/useInterviewAuthState";
import { useInterviewResumeState } from "@/features/interview-session/model/useInterviewResumeState";
import { useInterviewRoomFlow } from "@/features/interview-session/model/useInterviewRoomFlow";
import { useInterviewReportInsights } from "@/features/interview-session/model/useInterviewReportInsights";
import { useStartSession } from "@/features/interview/start-session/model/useStartSession";
import { useInterviewResumeActions } from "@/features/interview-session/model/useInterviewResumeActions";
import { useInterviewShellNavigation } from "@/features/interview-session/model/useInterviewShellNavigation";
import { useInterviewShellToast } from "@/features/interview-session/model/useInterviewShellToast";
import {
  buildRetryPreset,
  resolveSessionIdFromPath,
  resolveStepFromPath
} from "@/features/interview-session/model/interviewShell.utils";
import {
  resolveAvatarReportState,
  type AvatarState
} from "@/entities/avatar/model/avatarBehaviorMachine";
import {
  clearLegacyApiKeyStorage,
  clearStoredSessionId,
  setStoredSessionId
} from "@/shared/auth/session";
import { useToast } from "@/shared/ui/toast/useToast";

export type UseInterviewShellStateResult = {
  step: InterviewStep;
  setStep: (next: InterviewStep) => void;
  uiError: string | null;
  clearUiError: () => void;
  handleRetryUiError: () => Promise<void>;
  authStatus: "loading" | "member" | "guest" | "anonymous" | "error";
  isMemberAuthenticated: boolean;
  isAuthRequired: boolean;
  reportErrorCode: "auth_required" | "unknown" | null;
  authRedirectTarget: string;
  handleGoogleLogin: (redirectTo?: string) => Promise<void>;
  handleGoogleLogout: () => Promise<void>;
  isAuthLoading: boolean;
  backendStatus: "checking" | "ok" | "error";
  backendStatusMessage: string | null;
  retryBackendHealthCheck: () => Promise<void>;
  setupPayload: StartInterviewPayload;
  setSetupPayload: (next: StartInterviewPayload) => void;
  isStarting: boolean;
  sessionId: string | null;
  interviewerName: string;
  character: InterviewCharacter;
  avatarState: AvatarState;
  avatarCueToken: number;
  emotion: InterviewEmotion;
  ttsAudioRef: RefObject<HTMLAudioElement>;
  isAutoplayBlocked: boolean;
  playTtsAudio: () => void;
  isRecording: boolean;
  isSttSupported: boolean;
  isSttBusy: boolean;
  handleToggleRecording: () => void;
  reactionEnabled: boolean;
  jobRoleLabel: string;
  stackLabel: string;
  difficultyLabel: string;
  questionOrder: number;
  totalQuestions: number;
  followupCount: number;
  streamingQuestionText: string;
  isQuestionStreaming: boolean;
  messages: ChatMessage[];
  answerText: string;
  setAnswerText: (value: string) => void;
  isSubmitting: boolean;
  handleStartInterview: () => Promise<void>;
  handleSubmitAnswer: () => Promise<void>;
  handlePause: () => void;
  handleExit: () => Promise<void>;
  isExiting: boolean;
  report: InterviewReport | null;
  isReportLoading: boolean;
  reportErrorMessage: string | null;
  handleRetryReport: () => Promise<void>;
  handleGoInsights: () => Promise<void>;
  isInsightsLoading: boolean;
  insightsErrorMessage: string | null;
  sessions: SessionHistoryItem[];
  weakKeywords: string[];
  studyGuide: string[];
  questionGuides: ReportQuestionGuide[];
  isRetryingWeakness: boolean;
  handleRetryWeakness: () => Promise<void>;
  resumeCandidateSessionId: string | null;
  isResumePromptOpen: boolean;
  isResumeCandidateGuest: boolean;
  isResumeResolving: boolean;
  handleContinueResumeCandidate: () => Promise<void>;
  handleDismissResumeCandidate: () => void;
};

export type UseInterviewShellStateOptions = {
  initialStep?: InterviewStep;
  initialSessionId?: string | null;
};

export function useInterviewShellOrchestrator(
  options: UseInterviewShellStateOptions = {}
): UseInterviewShellStateResult {
  const pathname = usePathname();
  const { pushToast } = useToast();
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
  const { syncPathname, updateStep } = useInterviewShellNavigation(sessionId, setStep);

  const updateSetupPayload = useCallback((next: StartInterviewPayload) => {
    setSetupPayload(next);
  }, []);
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

  const clearUiError = useCallback(() => {
    setUiError(null);
    setAuthPromptReason(null);
  }, [setAuthPromptReason]);

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
  }, []);

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
  }, []);

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
  }, [isResumeResolving, restoreSessionIntoRoom, sessionId, step]);

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
      clearStartError,
      clearReportFetchError,
      resetResumeState,
      resetRoomState,
      resetReportState,
      setAuthPromptReason,
      showToastError,
      startRoomQuestionStream,
      startSession,
      syncPathname
    ]
  );
  beginInterviewRef.current = beginInterview;

  const handleStartInterview = useCallback(async () => {
    if (authStatus === "loading") {
      showToastError("인증 상태 확인 중입니다. 잠시 후 다시 시도해 주세요.", "auth:loading-start");
      return;
    }
    if (authStatus !== "member" && authStatus !== "guest") {
      const recovered = await retryAuthBootstrap();
      if (!recovered) {
        return;
      }
    }
    await beginInterview(setupPayload);
  }, [authStatus, beginInterview, retryAuthBootstrap, setupPayload, showToastError]);
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
  }, [isExiting, moveToReport, pendingCompletedSessionId]);

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
  }, [isExiting, isResumeResolving, moveToReport, sessionId, syncPathname]);

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
  }, [handleGoInsights, moveToReport, runBackendHealthCheck, sessionId, setAuthPromptReason, step]);
  const isMemberAuthenticated = useMemo(
    () => isMemberAuthenticatedBase && reportFlow.reportErrorCode !== "auth_required",
    [isMemberAuthenticatedBase, reportFlow.reportErrorCode]
  );
  const weakKeywords = reportFlow.weakKeywords;
  const studyGuide = reportFlow.studyGuide;
  const questionGuides = reportFlow.questionGuides;

  return {
    step,
    setStep: updateStep,
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
    retryBackendHealthCheck: runBackendHealthCheck,
    setupPayload,
    setSetupPayload: updateSetupPayload,
    isStarting,
    sessionId,
    interviewerName: interviewerNameMap[setupPayload.character],
    character: setupPayload.character,
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
    reactionEnabled: setupPayload.reactionEnabled,
    jobRoleLabel: mapRoleLabel(setupPayload.jobRole),
    stackLabel: setupPayload.stack,
    difficultyLabel: mapDifficultyLabel(setupPayload.difficulty),
    questionOrder: roomFlow.questionOrder,
    totalQuestions: setupPayload.questionCount,
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
  };
}
