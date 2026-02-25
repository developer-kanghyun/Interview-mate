"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { usePathname } from "next/navigation";
import {
  listSessions,
  pingBackendHealth,
  submitAnswer,
  type InterviewCharacter,
  type InterviewEmotion,
  type InterviewReport,
  type SessionHistoryItem,
  type StartInterviewPayload
} from "@/shared/api/interview-client";
import { getGoogleAuthUrl, getGuestAccess, getMyProfile } from "@/shared/api/interview";
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
  clearPostLoginRedirectTarget,
  clearLegacyApiKeyStorage,
  clearStoredSessionId,
  getAuthRequiredMessage,
  getStoredSessionId,
  setPostLoginRedirectTarget,
  setStoredSessionId
} from "@/shared/auth/session";

type UseInterviewShellStateResult = {
  step: InterviewStep;
  setStep: (next: InterviewStep) => void;
  uiError: string | null;
  clearUiError: () => void;
  handleRetryUiError: () => Promise<void>;
  isAuthRequired: boolean;
  authRedirectTarget: string;
  handleGoogleLogin: (redirectTo?: string) => Promise<void>;
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
  ttsNotice: string | null;
  clearTtsNotice: () => void;
  isRecording: boolean;
  isSttSupported: boolean;
  isSttBusy: boolean;
  sttNotice: string | null;
  clearSttNotice: () => void;
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
  if (/^\/report\/[^/]+$/.test(pathname)) {
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

export function useInterviewShellState(options: UseInterviewShellStateOptions = {}): UseInterviewShellStateResult {
  const pathname = usePathname();
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
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "ok" | "error">("checking");
  const [backendStatusMessage, setBackendStatusMessage] = useState<string | null>(null);
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [ttsNotice, setTtsNotice] = useState<string | null>(null);
  const [sttNotice, setSttNotice] = useState<string | null>(null);
  const ttsNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sttNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avatarCueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
        syncPathname("/setup");
        setStep("setup");
        return;
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

  const clearUiError = useCallback(() => {
    setUiError(null);
  }, []);

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

  const authRedirectTarget = useMemo(() => {
    if (step === "report" && sessionId) {
      return `/report/${sessionId}`;
    }
    if (step === "room" && sessionId) {
      return `/interview/${sessionId}`;
    }
    if (step === "insights") {
      return "/insights";
    }
    if (step === "setup") {
      return "/setup";
    }
    return "/interview";
  }, [sessionId, step]);

  const handleGoogleLogin = useCallback(async (redirectTo?: string) => {
    if (isAuthLoading) {
      return;
    }
    if (redirectTo) {
      setPostLoginRedirectTarget(redirectTo);
    } else {
      clearPostLoginRedirectTarget();
    }

    setIsAuthLoading(true);

    try {
      const response = await getGoogleAuthUrl();
      window.location.assign(response.data.auth_url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google 로그인 URL 조회에 실패했습니다.";
      if (message.includes("Google OAuth Client ID")) {
        setUiError("Google 로그인 설정이 올바르지 않습니다. 서버 OAuth 환경변수를 확인해 주세요.");
      } else {
        setUiError(message);
      }
    } finally {
      setIsAuthLoading(false);
    }
  }, [isAuthLoading]);

  const refreshSessions = useCallback(async () => {
    const sessionList = await listSessions(30);
    setSessions(sessionList);
  }, []);

  const clearTtsNotice = useCallback(() => {
    if (ttsNoticeTimerRef.current) {
      clearTimeout(ttsNoticeTimerRef.current);
      ttsNoticeTimerRef.current = null;
    }
    setTtsNotice(null);
  }, []);

  const showTtsNotice = useCallback(
    (message: string) => {
      if (ttsNoticeTimerRef.current) {
        clearTimeout(ttsNoticeTimerRef.current);
      }
      setTtsNotice(message);
      ttsNoticeTimerRef.current = setTimeout(() => {
        setTtsNotice(null);
        ttsNoticeTimerRef.current = null;
      }, 5000);
    },
    []
  );

  const clearSttNotice = useCallback(() => {
    if (sttNoticeTimerRef.current) {
      clearTimeout(sttNoticeTimerRef.current);
      sttNoticeTimerRef.current = null;
    }
    setSttNotice(null);
  }, []);

  const showSttNotice = useCallback(
    (message: string) => {
      if (sttNoticeTimerRef.current) {
        clearTimeout(sttNoticeTimerRef.current);
      }
      setSttNotice(message);
      sttNoticeTimerRef.current = setTimeout(() => {
        setSttNotice(null);
        sttNoticeTimerRef.current = null;
      }, 5000);
    },
    []
  );

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
    useInterviewerSpeech(setAvatarState, { onNotice: showTtsNotice });

  const isSttBusy = isRecording || isSubmitting || isQuestionStreaming || isExiting;
  const speakInterviewer = useCallback(
    (text: string) => rawSpeakInterviewer(text, setupPayload.character),
    [rawSpeakInterviewer, setupPayload.character]
  );
  const { stopQuestionStream, startQuestionStream } = useQuestionStreaming({
    stopTtsPlayback,
    appendMessage,
    speakInterviewer,
    setUiError,
    setIsQuestionStreaming,
    setStreamingQuestionText,
    setAvatarState,
    setQuestionOrder,
    setFollowupCount
  });
  const { isStarting, startSession, startError, clearStartError } = useStartSession();
  const { isFetchingReport, reportFetchError, fetchReport, clearReportFetchError } = useFetchReport();

  useEffect(() => {
    return () => {
      stopRecording();
      stopQuestionStream();
      stopTtsPlayback();
      if (ttsNoticeTimerRef.current) {
        clearTimeout(ttsNoticeTimerRef.current);
      }
      if (sttNoticeTimerRef.current) {
        clearTimeout(sttNoticeTimerRef.current);
      }
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
      showSttNotice("이 브라우저는 음성 인식을 지원하지 않습니다. 텍스트로 답변해 주세요.");
    } else {
      showSttNotice("음성 인식 실패 상태입니다. 버튼 눌러 다시 시도해 주세요.");
    }
    clearSpeechError();
  }, [clearSpeechError, isSttSupported, showSttNotice, speechError]);

  useEffect(() => {
    void runBackendHealthCheck();
  }, [runBackendHealthCheck]);

  useEffect(() => {
    if (!startError) {
      return;
    }
    setUiError(startError);
  }, [startError]);

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
    let active = true;
    void (async () => {
      try {
        const profile = await getMyProfile();
        if (!active) {
          return;
        }
        setIsGuestUser(!profile.data.email);
      } catch (error) {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : "로그인 상태 확인에 실패했습니다.";
        if (message !== getAuthRequiredMessage()) {
          setUiError(message);
          return;
        }

        try {
          await getGuestAccess();
          if (!active) {
            return;
          }
          setIsGuestUser(true);
        } catch (guestError) {
          if (!active) {
            return;
          }
          const guestMessage =
            guestError instanceof Error ? guestError.message : "게스트 인증 발급에 실패했습니다.";
          setUiError(guestMessage);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const storedSessionId = getStoredSessionId();
    if (!storedSessionId) {
      return;
    }
    clearStoredSessionId();
    setUiError(`이전 세션(${storedSessionId})은 재개할 수 없습니다. 새 면접을 시작해 주세요.`);
  }, []);

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
          setUiError(message);
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
        setUiError(message);
      } finally {
        setIsExiting(false);
      }
    },
    [clearAvatarCue, clearReportFetchError, fetchReport, isExiting, stopQuestionStream, stopRecording, stopTtsPlayback, syncPathname]
  );

  const beginInterview = useCallback(
    async (payload: StartInterviewPayload) => {
      setUiError(null);
      clearReportFetchError();
      setIsExiting(false);
      clearStartError();
      try {
        const started = await startSession(payload);
        if (!started) {
          return;
        }
        setStoredSessionId(started.sessionId);
        setSessionId(started.sessionId);
        setReport(null);
        setMessages([
          {
            id: `system-${Date.now()}`,
            role: "coach",
            content: "면접이 시작되었습니다. 질문을 듣고 120초 안에 핵심부터 답변해 주세요.",
            meta: "세션 시작"
          }
        ]);
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
        setUiError(message);
        clearStoredSessionId();
      }
    },
    [clearAvatarCue, clearReportFetchError, clearStartError, startQuestionStream, startSession, syncPathname]
  );

  const handleStartInterview = useCallback(async () => {
    await beginInterview(setupPayload);
  }, [beginInterview, setupPayload]);

  const handleSubmitAnswer = useCallback(async (options?: SubmitAnswerOptions) => {
    const inputType = options?.inputType ?? "text";
    const sourceAnswer = options?.answerOverride ?? answerText;
    if (!sessionId || !sourceAnswer.trim() || isSubmitting) {
      return;
    }

    const submittedAnswer = sourceAnswer.trim();
    appendMessage({
      id: `answer-${Date.now()}`,
      role: "user",
      content: submittedAnswer,
      meta: `Q${questionOrder}`
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

      appendMessage({
        id: `coach-${Date.now()}`,
        role: "coach",
        content: `${response.feedbackSummary}\n${response.coaching}`,
        meta: `점수 ${response.totalScore}`
      });

      if (response.isSessionComplete) {
        if (isGuestUser) {
          stopQuestionStream();
          stopTtsPlayback();
          setStep("report");
          syncPathname(`/report/${encodeURIComponent(sessionId)}`);
          setUiError(getAuthRequiredMessage());
          return;
        }
        await moveToReport(sessionId);
        return;
      }

      startQuestionStream(sessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "답변 제출에 실패했습니다.";
      setUiError(message);
      setAnswerText(submittedAnswer);
      setAvatarState("listening");

      appendMessage({
        id: `error-${Date.now()}`,
        role: "coach",
        content: `요청 처리 중 오류가 발생했습니다: ${message}`,
        meta: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    appendMessage,
    isGuestUser,
    isSubmitting,
    answerText,
    clearAvatarCue,
    moveToReport,
    questionOrder,
    triggerAvatarCue,
    sessionId,
    startQuestionStream,
    stopQuestionStream,
    stopTtsPlayback,
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
          showSttNotice("인식된 음성이 없어 전송하지 않았습니다. 다시 시도해 주세요.");
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

    clearSttNotice();
    clearSpeechError();
    clearAvatarCue();
    setAvatarState("listening");
    startRecording((transcript) => {
      setAnswerText(transcript);
    });
  }, [
    clearAvatarCue,
    clearSpeechError,
    clearSttNotice,
    showSttNotice,
    handleSubmitAnswer,
    isExiting,
    isQuestionStreaming,
    isRecording,
    isSubmitting,
    startRecording,
    stopRecording
  ]);

  const handlePause = useCallback(() => {
    clearAvatarCue();
    setAvatarState("idle");
    appendMessage({
      id: `pause-${Date.now()}`,
      role: "coach",
      content: "일시정지 상태입니다. 준비되면 답변 완료 버튼으로 계속 진행하세요.",
      meta: "pause"
    });
  }, [appendMessage, clearAvatarCue]);

  const handleExit = useCallback(async () => {
    if (isExiting) {
      return;
    }
    if (!sessionId) {
      clearStoredSessionId();
      syncPathname("/setup", "replace");
      setStep("setup");
      return;
    }
    await moveToReport(sessionId);
  }, [isExiting, moveToReport, sessionId, syncPathname]);

  const handleRetryReport = useCallback(async () => {
    if (!sessionId) {
      setUiError("세션 정보가 없어 리포트를 다시 조회할 수 없습니다.");
      return;
    }

    await moveToReport(sessionId);
  }, [moveToReport, sessionId]);

  const handleGoInsights = useCallback(async () => {
    if (isInsightsLoading) {
      return;
    }

    setUiError(null);
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
  }, [isInsightsLoading, refreshSessions, syncPathname]);

  const handleRetryUiError = useCallback(async () => {
    setUiError(null);
    if (step === "report" && sessionId) {
      await moveToReport(sessionId);
      return;
    }
    if (step === "insights") {
      await handleGoInsights();
      return;
    }
    await runBackendHealthCheck();
  }, [handleGoInsights, moveToReport, runBackendHealthCheck, sessionId, step]);

  const weakKeywords = useMemo(() => report?.weakKeywords ?? [], [report]);
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
    isAuthRequired: uiError === getAuthRequiredMessage(),
    authRedirectTarget,
    handleGoogleLogin,
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
    ttsNotice,
    clearTtsNotice,
    isRecording,
    isSttSupported,
    isSttBusy,
    sttNotice,
    clearSttNotice,
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
    handleRetryWeakness
  };
}
