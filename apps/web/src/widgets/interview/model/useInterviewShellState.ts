"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type SetStateAction
} from "react";
import { usePathname } from "next/navigation";
import {
  hasInterviewRuntimeState,
  listSessions,
  pingBackendHealth,
  restoreInterviewSession,
  submitAnswer,
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
import { useInterviewerSpeech } from "@/features/interview-session/model/useInterviewerSpeech";
import { useQuestionStreaming } from "@/features/interview-session/model/useQuestionStreaming";
import { useInterviewAuthState } from "@/features/interview-session/model/useInterviewAuthState";
import { useInterviewResumeState } from "@/features/interview-session/model/useInterviewResumeState";
import { useStartSession } from "@/features/interview/start-session/model/useStartSession";
import { useFetchReport } from "@/features/interview-report/model/useFetchReport";
import { useSpeechToText } from "@/shared/lib/useSpeechToText";
import {
  getAvatarTransientDurationMs,
  resolveAvatarReportState,
  resolveAvatarTransientStateFromAnswer,
  type AvatarState,
  type AvatarTransientState
} from "@/entities/avatar/model/avatarBehaviorMachine";
import {
  clearLegacyApiKeyStorage,
  clearStoredSessionId,
  getAuthRequiredMessage,
  setStoredSessionId
} from "@/shared/auth/session";
import { useToast } from "@/shared/ui/toast/useToast";

type UseInterviewShellStateResult = {
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

type SubmitAnswerOptions = {
  answerOverride?: string;
  inputType?: "text" | "voice";
};

type UseInterviewShellStateOptions = {
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
  return role === "frontend" ? "frontend" : "backend";
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

function buildSetupPayloadFromSessionState(
  state: Awaited<ReturnType<typeof getInterviewSessionState>>["data"]
): StartInterviewPayload {
  const jobRole = mapRoleFromApi(state.job_role);
  return {
    jobRole,
    stack: jobRole === "backend" ? "Spring Boot" : "Next.js",
    difficulty: "jobseeker",
    questionCount: state.total_questions,
    timerSeconds: 120,
    character: mapCharacterFromApi(state.interviewer_character),
    reactionEnabled: true
  };
}

const COACH_WARNING_SCORE_THRESHOLD = 70;

export function useInterviewShellState(options: UseInterviewShellStateOptions = {}): UseInterviewShellStateResult {
  const pathname = usePathname();
  const { pushToast } = useToast();
  const [step, setStep] = useState<InterviewStep>("setup");
  const [setupPayload, setSetupPayload] = useState<StartInterviewPayload>(defaultSetupPayload);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streamingQuestionText, setStreamingQuestionText] = useState("");
  const [isQuestionStreaming, setIsQuestionStreaming] = useState(false);
  const [questionOrder, setQuestionOrder] = useState(1);
  const [followupCount, setFollowupCount] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [insightsErrorMessage, setInsightsErrorMessage] = useState<string | null>(null);
  const [isRetryingWeakness, setIsRetryingWeakness] = useState(false);
  const [emotion, setEmotion] = useState<InterviewEmotion>("neutral");
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [activeAvatarCue, setActiveAvatarCue] = useState<AvatarTransientState | null>(null);
  const [avatarCueToken, setAvatarCueToken] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [toastError, setToastError] = useState<{ message: string; dedupeKey?: string } | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "ok" | "error">("checking");
  const [backendStatusMessage, setBackendStatusMessage] = useState<string | null>(null);
  const avatarCueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uiErrorRef = useRef<string | null>(null);
  const autoRestoreAttemptedSessionRef = useRef<string | null>(null);
  const startQuestionStreamRef = useRef<((sessionId: string) => void) | null>(null);
  const lastFollowupCountRef = useRef(0);
  const {
    isRecording,
    isSupported: isSttSupported,
    speechError,
    startRecording,
    stopRecording,
    clearSpeechError
  } = useSpeechToText();

  const routeStep = useMemo(
    () => options.initialStep ?? resolveStepFromPath(pathname),
    [options.initialStep, pathname]
  );
  const routeSessionId = useMemo(
    () => options.initialSessionId ?? resolveSessionIdFromPath(pathname),
    [options.initialSessionId, pathname]
  );

  useEffect(() => {
    uiErrorRef.current = uiError;
  }, [uiError]);

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

  const updateAnswerText = useCallback((value: string) => {
    setAnswerText(value);
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

  const appendMessage = useCallback((nextMessage: ChatMessage) => {
    setMessages((previous) => [...previous, nextMessage]);
  }, []);

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

  const refreshSessions = useCallback(async () => {
    const sessionList = await listSessions(30);
    setSessions(sessionList);
  }, []);

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
        setQuestionOrder(state.current_question.question_order);
        setFollowupCount(state.current_question.followup_count);
        lastFollowupCountRef.current = state.current_question.followup_count;
        setAnswerText("");
        setReport(null);
        setMessages([]);
        if (avatarCueTimerRef.current) {
          clearTimeout(avatarCueTimerRef.current);
          avatarCueTimerRef.current = null;
        }
        setActiveAvatarCue(null);
        setEmotion("neutral");
        setAvatarState("idle");
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
    [resetResumeState, setIsResumeResolving, showToastError, syncPathname]
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

  const triggerAvatarCue = useCallback((cue: AvatarTransientState) => {
    if (avatarCueTimerRef.current) {
      clearTimeout(avatarCueTimerRef.current);
    }

    setActiveAvatarCue(cue);
    setAvatarCueToken((current) => current + 1);
    avatarCueTimerRef.current = setTimeout(() => {
      setActiveAvatarCue(null);
      avatarCueTimerRef.current = null;
    }, getAvatarTransientDurationMs(cue));
  }, []);

  const clearAvatarCue = useCallback(() => {
    if (avatarCueTimerRef.current) {
      clearTimeout(avatarCueTimerRef.current);
      avatarCueTimerRef.current = null;
    }
    setActiveAvatarCue(null);
  }, []);

  const { ttsAudioRef, stopTtsPlayback, speakInterviewer: rawSpeakInterviewer, isAutoplayBlocked, playTtsAudio } =
    useInterviewerSpeech(setAvatarState, {
      onNotice: (message) =>
        showToast({
          message,
          variant: "info",
          dedupeKey: `tts:${message}`
        })
    });

  const isSttBusy = isRecording || isSubmitting || isQuestionStreaming || isExiting || isResumeResolving;
  const speakInterviewer = useCallback(
    (text: string) => rawSpeakInterviewer(text, setupPayload.character),
    [rawSpeakInterviewer, setupPayload.character]
  );
  const routeUiError = useCallback((next: SetStateAction<string | null>) => {
    const resolved = typeof next === "function" ? next(uiErrorRef.current) : next;
    if (!resolved) {
      setUiError(null);
      setAuthPromptReason(null);
      return;
    }
    if (resolved === getAuthRequiredMessage()) {
      setAuthPromptReason("auth_required");
      setUiError(resolved);
      return;
    }
    setAuthPromptReason(null);
    showToastError(resolved, `ui:${resolved}`);
  }, [setAuthPromptReason, showToastError]);

  const { stopQuestionStream, startQuestionStream } = useQuestionStreaming({
    stopTtsPlayback,
    appendMessage,
    speakInterviewer,
    setUiError: routeUiError,
    setIsQuestionStreaming,
    setStreamingQuestionText,
    setAvatarState,
    setQuestionOrder,
    setFollowupCount
  });
  startQuestionStreamRef.current = startQuestionStream;
  const { isStarting, startSession, startError, clearStartError } = useStartSession();
  const { isFetchingReport, reportFetchError, reportFetchErrorCode, fetchReport, clearReportFetchError } = useFetchReport();

  useEffect(() => {
    return () => {
      stopRecording();
      stopQuestionStream();
      stopTtsPlayback();
      if (avatarCueTimerRef.current) {
        clearTimeout(avatarCueTimerRef.current);
      }
    };
  }, [stopQuestionStream, stopRecording, stopTtsPlayback]);

  useEffect(() => {
    if (step === "room" || !isRecording) {
      return;
    }
    stopRecording();
  }, [isRecording, step, stopRecording]);

  useEffect(() => {
    if (!speechError) {
      return;
    }

    if (!isSttSupported) {
      showToast({
        message: "이 브라우저는 음성 인식을 지원하지 않습니다. 텍스트로 답변해 주세요.",
        variant: "info",
        dedupeKey: "stt:not-supported"
      });
    } else {
      showToast({
        message: "음성 인식 실패 상태입니다. 버튼 눌러 다시 시도해 주세요.",
        variant: "warning",
        dedupeKey: "stt:recognition-failed"
      });
    }
    clearSpeechError();
  }, [clearSpeechError, isSttSupported, showToast, speechError]);

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

  const moveToReport = useCallback(
    async (targetSessionId: string) => {
      if (isExiting) {
        return;
      }

      setIsExiting(true);
      stopRecording();
      stopQuestionStream();
      stopTtsPlayback();
      setUiError(null);
      setAuthPromptReason(null);
      clearReportFetchError();
      syncPathname(`/report/${encodeURIComponent(targetSessionId)}`);
      setStep("report");
      setReport(null);

      try {
        const sessionsPromise = listSessions(30);
        const nextReport = await fetchReport(targetSessionId);

        try {
          const nextSessions = await sessionsPromise;
          setSessions(nextSessions);
        } catch (error) {
          const message = error instanceof Error ? error.message : "세션 목록 조회에 실패했습니다.";
          showToastError(message, "sessions:list");
        }

        if (!nextReport) {
          return;
        }

        setReport(nextReport);
        clearAvatarCue();
        setAvatarState(resolveAvatarReportState(nextReport.totalScore));
        clearStoredSessionId();
      } catch (error) {
        const message = error instanceof Error ? error.message : "리포트 조회에 실패했습니다.";
        showToastError(message, "report:move");
      } finally {
        setIsExiting(false);
      }
    },
    [
      clearAvatarCue,
      clearReportFetchError,
      fetchReport,
      isExiting,
      setAuthPromptReason,
      showToastError,
      stopQuestionStream,
      stopRecording,
      stopTtsPlayback,
      syncPathname
    ]
  );

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
        setReport(null);
        setMessages([]);
        clearAvatarCue();
        setFollowupCount(0);
        lastFollowupCountRef.current = 0;
        setQuestionOrder(1);
        setAnswerText("");
        setEmotion("neutral");
        setAvatarState("idle");
        setStep("room");
        syncPathname(`/interview/${encodeURIComponent(started.sessionId)}`);
        startQuestionStream(started.sessionId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "면접 시작에 실패했습니다.";
        showToastError(message, "interview:start");
        clearStoredSessionId();
      }
    },
    [
      clearAvatarCue,
      clearReportFetchError,
      clearStartError,
      resetResumeState,
      setAuthPromptReason,
      showToastError,
      startQuestionStream,
      startSession,
      syncPathname
    ]
  );

  const handleStartInterview = useCallback(async () => {
    await beginInterview(setupPayload);
  }, [beginInterview, setupPayload]);

  const handleSubmitAnswer = useCallback(async (options?: SubmitAnswerOptions) => {
    const inputType = options?.inputType ?? "text";
    const sourceAnswer = options?.answerOverride ?? answerText;
    if (!sessionId || !sourceAnswer.trim() || isSubmitting || isResumeResolving) {
      return;
    }

    const submittedAnswer = sourceAnswer.trim();
    appendMessage({
      id: `answer-${Date.now()}`,
      role: "user",
      content: submittedAnswer
    });

    setAnswerText("");
    setIsSubmitting(true);
    setAvatarState("thinking");
    setUiError(null);

    try {
      const response = await submitAnswer(sessionId, submittedAnswer, inputType);
      const previousFollowupCount = lastFollowupCountRef.current;
      setEmotion(response.suggestedEmotion);
      setFollowupCount(response.followupCount);
      lastFollowupCountRef.current = response.followupCount;

      const nextCue = resolveAvatarTransientStateFromAnswer({
        previousFollowupCount,
        nextFollowupCount: response.followupCount,
        totalScore: response.totalScore,
        suggestedEmotion: response.suggestedEmotion
      });

      if (nextCue) {
        triggerAvatarCue(nextCue);
      } else {
        clearAvatarCue();
      }

      const needsCoachWarning = response.totalScore < COACH_WARNING_SCORE_THRESHOLD;
      const coachContent = needsCoachWarning
        ? `답변 보완이 필요합니다.\n${response.feedbackSummary}\n${response.coaching}`
        : `${response.feedbackSummary}\n${response.coaching}`;

      appendMessage({
        id: `coach-${Date.now()}`,
        role: "coach",
        content: coachContent,
        tone: needsCoachWarning ? "error" : "default"
      });

      if (response.isSessionComplete) {
        if (isGuestUser) {
          stopQuestionStream();
          stopTtsPlayback();
          setStep("report");
          syncPathname(`/report/${encodeURIComponent(sessionId)}`);
          setAuthPromptReason("auth_required");
          setUiError(null);
          return;
        }
        await moveToReport(sessionId);
        return;
      }

      startQuestionStream(sessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "답변 제출에 실패했습니다.";
      if (message === getAuthRequiredMessage()) {
        setAuthPromptReason("auth_required");
        setUiError(message);
      } else {
        setAuthPromptReason(null);
        showToastError(message, "answer:submit");
      }
      setAnswerText(submittedAnswer);
      setAvatarState("listening");

      appendMessage({
        id: `error-${Date.now()}`,
        role: "coach",
        content: `요청 처리 중 오류가 발생했습니다: ${message}`,
        tone: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    appendMessage,
    isGuestUser,
    isSubmitting,
    isResumeResolving,
    answerText,
    clearAvatarCue,
    moveToReport,
    setAuthPromptReason,
    triggerAvatarCue,
    sessionId,
    startQuestionStream,
    stopQuestionStream,
    stopTtsPlayback,
    showToastError,
    syncPathname
  ]);

  const handleToggleRecording = useCallback(() => {
    if (isSubmitting || isQuestionStreaming || isExiting) {
      return;
    }

    if (isRecording) {
      stopRecording((finalTranscript) => {
        const trimmedTranscript = finalTranscript.trim();
        if (!trimmedTranscript) {
          showToast({
            message: "인식된 음성이 없어 전송하지 않았습니다. 다시 시도해 주세요.",
            variant: "warning",
            dedupeKey: "stt:empty-transcript"
          });
          return;
        }
        setAnswerText(trimmedTranscript);
        void handleSubmitAnswer({
          answerOverride: trimmedTranscript,
          inputType: "voice"
        });
      });
      return;
    }

    clearSpeechError();
    clearAvatarCue();
    setAvatarState("listening");
    startRecording((transcript) => {
      setAnswerText(transcript);
    });
  }, [
    clearAvatarCue,
    clearSpeechError,
    handleSubmitAnswer,
    isExiting,
    isQuestionStreaming,
    isRecording,
    isSubmitting,
    showToast,
    startRecording,
    stopRecording
  ]);

  const handlePause = useCallback(() => {
    clearAvatarCue();
    setAvatarState("idle");
    appendMessage({
      id: `pause-${Date.now()}`,
      role: "coach",
      content: "일시정지 상태입니다. 준비되면 답변 완료 버튼으로 계속 진행하세요."
    });
  }, [appendMessage, clearAvatarCue]);

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

  const handleRetryReport = useCallback(async () => {
    if (!sessionId) {
      showToastError("세션 정보가 없어 리포트를 다시 조회할 수 없습니다.", "report:retry-without-session");
      return;
    }

    await moveToReport(sessionId);
  }, [moveToReport, sessionId, showToastError]);

  const handleGoInsights = useCallback(async () => {
    if (isInsightsLoading) {
      return;
    }

    setUiError(null);
    setAuthPromptReason(null);
    setInsightsErrorMessage(null);
    syncPathname("/insights");
    setStep("insights");
    setIsInsightsLoading(true);

    try {
      await refreshSessions();
    } catch (error) {
      const message = error instanceof Error ? error.message : "세션 목록 조회에 실패했습니다.";
      setInsightsErrorMessage(message);
    } finally {
      setIsInsightsLoading(false);
    }
  }, [isInsightsLoading, refreshSessions, setAuthPromptReason, syncPathname]);

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
  const weakKeywords = useMemo(() => report?.weakKeywords ?? [], [report]);
  const isMemberAuthenticated = useMemo(
    () => isMemberAuthenticatedBase && reportFetchErrorCode !== "auth_required",
    [isMemberAuthenticatedBase, reportFetchErrorCode]
  );
  const effectiveAvatarState = useMemo(
    () => activeAvatarCue ?? avatarState,
    [activeAvatarCue, avatarState]
  );
  const studyGuide = useMemo(
    () =>
      report?.studyGuide ?? [
        "답변을 결론-근거-예시 순서로 구조화하세요.",
        "약점 키워드 위주로 재연습 세션을 반복하세요."
      ],
    [report]
  );

  const handleRetryWeakness = useCallback(async () => {
    if (isRetryingWeakness || isStarting) {
      return;
    }

    // 고정 규칙: 약점 키워드로 역할/스택 프리셋, 점수 기준 난이도 보정, 문항 수는 최대 5개
    const retryPreset = buildRetryPreset(weakKeywords, setupPayload);
    const retryPayload: StartInterviewPayload = {
      ...setupPayload,
      ...retryPreset,
      difficulty: report && report.totalScore >= 70 ? "junior" : "jobseeker",
      questionCount: Math.min(setupPayload.questionCount, 5)
    };

    setIsRetryingWeakness(true);
    try {
      syncPathname("/setup");
      setStep("setup");
      setSetupPayload(retryPayload);
      await beginInterview(retryPayload);
    } finally {
      setIsRetryingWeakness(false);
    }
  }, [beginInterview, isRetryingWeakness, isStarting, report, setupPayload, syncPathname, weakKeywords]);

  return {
    step,
    setStep: updateStep,
    uiError,
    clearUiError,
    handleRetryUiError,
    authStatus,
    isMemberAuthenticated,
    isAuthRequired,
    reportErrorCode: reportFetchErrorCode,
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
    avatarState: effectiveAvatarState,
    avatarCueToken,
    emotion,
    ttsAudioRef,
    isAutoplayBlocked,
    playTtsAudio,
    isRecording,
    isSttSupported,
    isSttBusy,
    handleToggleRecording,
    reactionEnabled: setupPayload.reactionEnabled,
    jobRoleLabel: mapRoleLabel(setupPayload.jobRole),
    stackLabel: setupPayload.stack,
    difficultyLabel: mapDifficultyLabel(setupPayload.difficulty),
    questionOrder,
    totalQuestions: setupPayload.questionCount,
    followupCount,
    streamingQuestionText,
    isQuestionStreaming,
    messages,
    answerText,
    setAnswerText: updateAnswerText,
    isSubmitting,
    handleStartInterview,
    handleSubmitAnswer,
    handlePause,
    handleExit,
    isExiting,
    report,
    isReportLoading: isFetchingReport,
    reportErrorMessage: reportFetchError,
    handleRetryReport,
    handleGoInsights,
    isInsightsLoading,
    insightsErrorMessage,
    sessions,
    weakKeywords,
    studyGuide,
    isRetryingWeakness,
    handleRetryWeakness,
    resumeCandidateSessionId,
    isResumePromptOpen,
    isResumeCandidateGuest,
    isResumeResolving,
    handleContinueResumeCandidate,
    handleDismissResumeCandidate
  };
}
