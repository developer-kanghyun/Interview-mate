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
  restoreInterviewSession,
  type InterviewCharacter,
  type InterviewEmotion,
  type InterviewReport,
  type SessionHistoryItem,
  type StartInterviewPayload
} from "@/shared/api/interview-client";
import { getInterviewSessionState } from "@/shared/api/interview";
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
  isRetryingWeakness: boolean;
  handleRetryWeakness: () => Promise<void>;
  resumeCandidateSessionId: string | null;
  isResumePromptOpen: boolean;
  isResumeCandidateGuest: boolean;
  isResumeResolving: boolean;
  handleContinueResumeCandidate: () => Promise<void>;
  handleDismissResumeCandidate: () => void;
};

type RetryPreset = {
  jobRole?: StartInterviewPayload["jobRole"];
  stack?: StartInterviewPayload["stack"];
};

export type UseInterviewShellStateOptions = {
  initialStep?: InterviewStep;
  initialSessionId?: string | null;
};

function resolveStepFromPath(pathname: string | null): InterviewStep | null {
  if (!pathname) {
    return null;
  }
  if (pathname === "/setup") {
    return "setup";
  }
  if (pathname === "/insights") {
    return "insights";
  }
  if (pathname === "/report" || /^\/report\/[^/]+$/.test(pathname)) {
    return "report";
  }
  if (/^\/interview\/[^/]+$/.test(pathname)) {
    return "room";
  }
  return null;
}

function resolveSessionIdFromPath(pathname: string | null) {
  if (!pathname) {
    return null;
  }
  const matched = pathname.match(/^\/(?:interview|report)\/([^/]+)$/);
  if (!matched) {
    return null;
  }
  return decodeURIComponent(matched[1]);
}

function buildRetryPreset(weakKeywords: string[], fallback: StartInterviewPayload): RetryPreset {
  const keywordText = weakKeywords.join(" ").toLowerCase();

  const backendSignals = ["api", "db", "sql", "transaction", "spring", "jpa", "redis", "cache", "서버", "백엔드"];
  const frontendSignals = ["react", "next", "vue", "ui", "ux", "렌더링", "상태", "프론트", "컴포넌트", "css", "접근성"];

  const hasBackendSignal = backendSignals.some((signal) => keywordText.includes(signal));
  const hasFrontendSignal = frontendSignals.some((signal) => keywordText.includes(signal));

  if (hasBackendSignal && !hasFrontendSignal) {
    return {
      jobRole: "backend",
      stack: "Spring Boot"
    };
  }

  if (hasFrontendSignal && !hasBackendSignal) {
    return {
      jobRole: "frontend",
      stack: "Next.js"
    };
  }

  return {
    jobRole: fallback.jobRole,
    stack: fallback.stack
  };
}

function mapRoleFromApi(role: string | null | undefined): StartInterviewPayload["jobRole"] {
  switch (role) {
    case "frontend":
    case "app":
    case "cloud":
    case "data":
    case "design":
    case "pm":
      return role;
    case "backend":
    default:
      return "backend";
  }
}

function defaultStackByRole(role: StartInterviewPayload["jobRole"]) {
  switch (role) {
    case "backend":
      return "Spring Boot";
    case "frontend":
      return "Next.js";
    case "app":
      return "React Native";
    case "cloud":
      return "AWS";
    case "data":
      return "Python";
    case "design":
      return "Figma";
    case "pm":
      return "PRD";
    default:
      return "Spring Boot";
  }
}

function mapCharacterFromApi(character: "luna" | "jet" | "iron" | null | undefined): InterviewCharacter {
  if (character === "jet") {
    return "zet";
  }
  if (character === "luna") {
    return "luna";
  }
  return "iron";
}

function mapDifficultyFromApi(difficulty: string | null | undefined): StartInterviewPayload["difficulty"] {
  return difficulty === "junior" ? "junior" : "jobseeker";
}

function buildSetupPayloadFromSessionState(
  state: Awaited<ReturnType<typeof getInterviewSessionState>>["data"]
): StartInterviewPayload {
  const jobRole = mapRoleFromApi(state.job_role);
  return {
    jobRole,
    stack: typeof state.stack === "string" && state.stack.trim().length > 0
      ? state.stack.trim()
      : defaultStackByRole(jobRole),
    difficulty: mapDifficultyFromApi(state.difficulty),
    questionCount: state.total_questions,
    timerSeconds: 120,
    character: mapCharacterFromApi(state.interviewer_character),
    reactionEnabled: true
  };
}

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
  const [toastError, setToastError] = useState<{ message: string; dedupeKey?: string } | null>(null);
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

  const syncPathname = useCallback((nextPath: string, mode: "push" | "replace" = "push") => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.location.pathname === nextPath) {
      return;
    }

    if (mode === "replace") {
      window.history.replaceState(window.history.state, "", nextPath);
      return;
    }

    window.history.pushState(window.history.state, "", nextPath);
  }, []);

  const updateStep = useCallback((next: InterviewStep) => {
    if (next === "setup") {
      syncPathname("/setup");
    } else if (next === "insights") {
      syncPathname("/insights");
    } else if (next === "report") {
      if (sessionId) {
        syncPathname(`/report/${encodeURIComponent(sessionId)}`);
      } else {
        syncPathname("/report");
      }
    }
    setStep(next);
  }, [sessionId, syncPathname]);

  const updateSetupPayload = useCallback((next: StartInterviewPayload) => {
    setSetupPayload(next);
  }, []);

  const showToast = useCallback(
    (options: {
      message: string;
      variant?: "info" | "success" | "warning" | "error";
      dedupeKey?: string;
      title?: string;
    }) => {
      pushToast({
        message: options.message,
        variant: options.variant,
        dedupeKey: options.dedupeKey,
        title: options.title
      });
    },
    [pushToast]
  );

  const showToastError = useCallback((message: string, dedupeKey?: string) => {
    setToastError({ message, dedupeKey });
  }, []);

  useEffect(() => {
    if (!toastError) {
      return;
    }

    showToast({
      message: toastError.message,
      variant: "error",
      dedupeKey: toastError.dedupeKey ?? `error:${toastError.message}`
    });
    setToastError(null);
  }, [showToast, toastError]);

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
    handleGoogleLogout
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

  const restoreSessionIntoRoom = useCallback(
    async (
      targetSessionId: string,
      options?: {
        stepFallbackMessage?: string;
      }
    ) => {
      setIsResumeResolving(true);
      setUiError(null);

      try {
        const stateResponse = await getInterviewSessionState(targetSessionId);
        const state = stateResponse.data;
        if (state.status !== "in_progress" || !state.current_question) {
          throw new Error("재개 가능한 진행중 세션이 없습니다. 새 면접을 시작해 주세요.");
        }

        await restoreInterviewSession(targetSessionId);

        setSessionId(targetSessionId);
        setSetupPayload(buildSetupPayloadFromSessionState(state));
        resetRoomState({
          questionOrder: state.current_question.question_order,
          followupCount: state.current_question.followup_count,
          clearMessages: true
        });
        resetReportState();
        setStep("room");
        syncPathname(`/interview/${encodeURIComponent(targetSessionId)}`, "replace");
        startQuestionStreamRef.current?.(targetSessionId);
        clearStoredSessionId();
        resetResumeState();
      } catch (error) {
        const fallbackMessage = options?.stepFallbackMessage ?? "이전 세션 재개에 실패했습니다. 새 면접을 시작해 주세요.";
        const message = error instanceof Error ? error.message : fallbackMessage;
        setStep("setup");
        syncPathname("/setup", "replace");
        resetResumeState();
        showToastError(message || fallbackMessage, "resume:restore-failed");
      } finally {
        setIsResumeResolving(false);
      }
    },
    [
      resetReportState,
      resetResumeState,
      resetRoomState,
      setIsResumeResolving,
      showToastError,
      syncPathname
    ]
  );

  const handleContinueResumeCandidate = useCallback(async () => {
    if (!resumeCandidateSessionId || isResumeResolving) {
      return;
    }

    if (isResumeCandidateGuest) {
      setIsResumeResolving(true);
      setIsResumePromptOpen(false);
      try {
        await handleGoogleLogin(`/interview/${encodeURIComponent(resumeCandidateSessionId)}`);
      } finally {
        setIsResumeResolving(false);
      }
      return;
    }

    await restoreSessionIntoRoom(resumeCandidateSessionId);
  }, [
    handleGoogleLogin,
    isResumeCandidateGuest,
    isResumeResolving,
    restoreSessionIntoRoom,
    setIsResumePromptOpen,
    setIsResumeResolving,
    resumeCandidateSessionId
  ]);

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
    await beginInterview(setupPayload);
  }, [beginInterview, setupPayload]);
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
