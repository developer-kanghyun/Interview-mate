"use client";

import { useCallback, useEffect, useMemo, useState, type RefObject } from "react";
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
import type { AvatarState } from "@/entities/avatar/ui/InterviewerAvatarAnimated";
import {
  defaultSetupPayload,
  interviewerNameMap,
  mapDifficultyLabel,
  mapRoleLabel,
  type InterviewStep
} from "@/features/interview-session/model/interviewSession.constants";
import { useInterviewerSpeech } from "@/features/interview-session/model/useInterviewerSpeech";
import { useQuestionStreaming } from "@/features/interview-session/model/useQuestionStreaming";
import { useStartSession } from "@/features/interview/start-session/model/useStartSession";
import { useFetchReport } from "@/features/interview-report/model/useFetchReport";
import {
  clearLegacyApiKeyStorage,
  clearStoredSessionId,
  getAuthRequiredMessage,
  getStoredSessionId,
  setStoredSessionId
} from "@/shared/auth/session";

type UseInterviewShellStateResult = {
  step: InterviewStep;
  setStep: (next: InterviewStep) => void;
  uiError: string | null;
  isAuthRequired: boolean;
  handleGoogleLogin: () => Promise<void>;
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
  emotion: InterviewEmotion;
  ttsAudioRef: RefObject<HTMLAudioElement>;
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

const INSIGHTS_LOOKBACK_DAYS = 30 as const;

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

export function useInterviewShellState(): UseInterviewShellStateResult {
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
  const [isRetryingWeakness, setIsRetryingWeakness] = useState(false);
  const [emotion, setEmotion] = useState<InterviewEmotion>("neutral");
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "ok" | "error">("checking");
  const [backendStatusMessage, setBackendStatusMessage] = useState<string | null>(null);

  const updateStep = useCallback((next: InterviewStep) => {
    setStep(next);
  }, []);

  const updateSetupPayload = useCallback((next: StartInterviewPayload) => {
    setSetupPayload(next);
  }, []);

  const updateAnswerText = useCallback((value: string) => {
    setAnswerText(value);
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

  const handleGoogleLogin = useCallback(async () => {
    setUiError(null);
    try {
      const response = await getGoogleAuthUrl();
      window.location.assign(response.data.auth_url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google 로그인 URL 조회에 실패했습니다.";
      setUiError(message);
    }
  }, []);

  const refreshSessions = useCallback(async () => {
    const days = INSIGHTS_LOOKBACK_DAYS;
    const sessionList = await listSessions(days);
    setSessions(sessionList);
  }, []);

  const { ttsAudioRef, stopTtsPlayback, speakInterviewer } = useInterviewerSpeech(setAvatarState);
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
      stopQuestionStream();
      stopTtsPlayback();
    };
  }, [stopQuestionStream, stopTtsPlayback]);

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
    let active = true;
    void (async () => {
      try {
        await getMyProfile();
        if (!active) {
          return;
        }
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
      stopQuestionStream();
      stopTtsPlayback();
      setUiError(null);
      clearReportFetchError();
      setStep("report");
      setReport(null);

      try {
        const sessionsPromise = listSessions(INSIGHTS_LOOKBACK_DAYS);
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
        setAvatarState(nextReport.totalScore >= 75 ? "react_positive" : "react_negative");
        clearStoredSessionId();
      } catch (error) {
        const message = error instanceof Error ? error.message : "리포트 조회에 실패했습니다.";
        setUiError(message);
      } finally {
        setIsExiting(false);
      }
    },
    [clearReportFetchError, fetchReport, isExiting, stopQuestionStream, stopTtsPlayback]
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
        setFollowupCount(0);
        setQuestionOrder(1);
        setAnswerText("");
        setEmotion("neutral");
        setStep("room");
        startQuestionStream(started.sessionId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "면접 시작에 실패했습니다.";
        setUiError(message);
        clearStoredSessionId();
      }
    },
    [clearReportFetchError, clearStartError, startQuestionStream, startSession]
  );

  const handleStartInterview = useCallback(async () => {
    await beginInterview(setupPayload);
  }, [beginInterview, setupPayload]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!sessionId || !answerText.trim() || isSubmitting) {
      return;
    }

    const submittedAnswer = answerText.trim();
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
      const response = await submitAnswer(sessionId, submittedAnswer);
      setEmotion(response.suggestedEmotion);
      setFollowupCount(response.followupCount);

      appendMessage({
        id: `coach-${Date.now()}`,
        role: "coach",
        content: `${response.feedbackSummary}\n${response.coaching}`,
        meta: `점수 ${response.totalScore}`
      });

      if (response.isSessionComplete) {
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
  }, [answerText, appendMessage, isSubmitting, moveToReport, questionOrder, sessionId, startQuestionStream]);

  const handlePause = useCallback(() => {
    setAvatarState("idle");
    appendMessage({
      id: `pause-${Date.now()}`,
      role: "coach",
      content: "일시정지 상태입니다. 준비되면 답변 완료 버튼으로 계속 진행하세요.",
      meta: "pause"
    });
  }, [appendMessage]);

  const handleExit = useCallback(async () => {
    if (isExiting) {
      return;
    }
    if (!sessionId) {
      clearStoredSessionId();
      setStep("setup");
      return;
    }
    await moveToReport(sessionId);
  }, [isExiting, moveToReport, sessionId]);

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
    setStep("insights");
    setIsInsightsLoading(true);

    try {
      await refreshSessions();
    } catch (error) {
      const message = error instanceof Error ? error.message : "세션 목록 조회에 실패했습니다.";
      setUiError(message);
    } finally {
      setIsInsightsLoading(false);
    }
  }, [isInsightsLoading, refreshSessions]);

  const weakKeywords = useMemo(() => report?.weakKeywords ?? [], [report]);
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

    const retryPreset = buildRetryPreset(weakKeywords, setupPayload);
    const retryPayload: StartInterviewPayload = {
      ...setupPayload,
      ...retryPreset,
      difficulty: report && report.totalScore >= 70 ? "junior" : "jobseeker",
      questionCount: Math.min(setupPayload.questionCount, 5)
    };

    setIsRetryingWeakness(true);
    try {
      setStep("setup");
      setSetupPayload(retryPayload);
      await beginInterview(retryPayload);
    } finally {
      setIsRetryingWeakness(false);
    }
  }, [beginInterview, isRetryingWeakness, isStarting, report, setupPayload, weakKeywords]);

  return {
    step,
    setStep: updateStep,
    uiError,
    isAuthRequired: uiError === getAuthRequiredMessage(),
    handleGoogleLogin,
    backendStatus,
    backendStatusMessage,
    retryBackendHealthCheck: runBackendHealthCheck,
    setupPayload,
    setSetupPayload: updateSetupPayload,
    isStarting,
    sessionId,
    interviewerName: interviewerNameMap[setupPayload.character],
    character: setupPayload.character,
    avatarState,
    emotion,
    ttsAudioRef,
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
    sessions,
    weakKeywords,
    studyGuide,
    isRetryingWeakness,
    handleRetryWeakness
  };
}
