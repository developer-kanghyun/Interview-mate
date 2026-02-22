"use client";

import { useCallback, useEffect, useMemo, useState, type RefObject } from "react";
import {
  getReport,
  listSessions,
  pingBackendHealth,
  startInterview,
  submitAnswer,
  type InterviewCharacter,
  type InterviewEmotion,
  type InterviewReport,
  type SessionHistoryItem,
  type StartInterviewPayload
} from "@/shared/api/interview-client";
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

type UseInterviewShellStateResult = {
  step: InterviewStep;
  setStep: (next: InterviewStep) => void;
  uiError: string | null;
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
  handleStartInterview: () => Promise<void>;
  handleSubmitAnswer: () => Promise<void>;
  handlePause: () => void;
  handleExit: () => Promise<void>;
  report: InterviewReport | null;
  handleGoInsights: () => Promise<void>;
  sessions: SessionHistoryItem[];
  weakKeywords: string[];
  studyGuide: string[];
  periodDays: 30 | 60 | 90;
  handleChangePeriod: (days: 30 | 60 | 90) => Promise<void>;
  handleRetryWeakness: () => void;
};

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
  const [periodDays, setPeriodDays] = useState<30 | 60 | 90>(30);
  const [emotion, setEmotion] = useState<InterviewEmotion>("neutral");
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const refreshSessions = useCallback(async (days: 30 | 60 | 90) => {
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

  useEffect(() => {
    return () => {
      stopQuestionStream();
      stopTtsPlayback();
    };
  }, [stopQuestionStream, stopTtsPlayback]);

  useEffect(() => {
    void runBackendHealthCheck();
  }, [runBackendHealthCheck]);

  const moveToReport = useCallback(
    async (targetSessionId: string) => {
      stopQuestionStream();
      stopTtsPlayback();
      setUiError(null);

      try {
        const [nextReport, nextSessions] = await Promise.all([getReport(targetSessionId), listSessions(periodDays)]);
        setReport(nextReport);
        setSessions(nextSessions);
        setAvatarState(nextReport.totalScore >= 75 ? "react_positive" : "react_negative");
        setStep("report");
      } catch (error) {
        const message = error instanceof Error ? error.message : "리포트 조회에 실패했습니다.";
        setUiError(message);
      }
    },
    [periodDays, stopQuestionStream, stopTtsPlayback]
  );

  const handleStartInterview = useCallback(async () => {
    setIsStarting(true);
    setUiError(null);
    try {
      const started = await startInterview(setupPayload);
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
    } finally {
      setIsStarting(false);
    }
  }, [setupPayload, startQuestionStream]);

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
    if (!sessionId) {
      setStep("setup");
      return;
    }
    await moveToReport(sessionId);
  }, [moveToReport, sessionId]);

  const handleGoInsights = useCallback(async () => {
    setUiError(null);
    setStep("insights");

    try {
      await refreshSessions(periodDays);
    } catch (error) {
      const message = error instanceof Error ? error.message : "세션 목록 조회에 실패했습니다.";
      setUiError(message);
    }
  }, [periodDays, refreshSessions]);

  const handleChangePeriod = useCallback(
    async (days: 30 | 60 | 90) => {
      setPeriodDays(days);
      setUiError(null);
      try {
        await refreshSessions(days);
      } catch (error) {
        const message = error instanceof Error ? error.message : "세션 목록 조회에 실패했습니다.";
        setUiError(message);
      }
    },
    [refreshSessions]
  );

  const handleRetryWeakness = useCallback(() => {
    setStep("setup");
    setSetupPayload((previous) => ({
      ...previous,
      questionCount: Math.min(previous.questionCount, 5)
    }));
  }, []);

  const weakKeywords = useMemo(() => report?.weakKeywords ?? [], [report]);
  const studyGuide = useMemo(
    () =>
      report?.studyGuide ?? [
        "답변을 결론-근거-예시 순서로 구조화하세요.",
        "약점 키워드 위주로 재연습 세션을 반복하세요."
      ],
    [report]
  );

  return {
    step,
    setStep: updateStep,
    uiError,
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
    handleStartInterview,
    handleSubmitAnswer,
    handlePause,
    handleExit,
    report,
    handleGoInsights,
    sessions,
    weakKeywords,
    studyGuide,
    periodDays,
    handleChangePeriod,
    handleRetryWeakness
  };
}
