"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type Dispatch,
  type SetStateAction
} from "react";
import {
  submitAnswer,
  type InterviewEmotion,
  type StartInterviewPayload
} from "@/shared/api/interview-client";
import type { ChatMessage } from "@/shared/chat/ChatBoard";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";
import { useInterviewerSpeech } from "@/features/interview-session/model/useInterviewerSpeech";
import { useQuestionStreaming } from "@/features/interview-session/model/useQuestionStreaming";
import { useSpeechToText } from "@/shared/lib/useSpeechToText";
import {
  getAvatarTransientDurationMs,
  resolveAvatarTransientStateFromAnswer,
  type AvatarState,
  type AvatarTransientState
} from "@/entities/avatar/model/avatarBehaviorMachine";
import { getAuthRequiredMessage } from "@/shared/auth/session";

const COACH_WARNING_SCORE_THRESHOLD = 70;

type ToastVariant = "info" | "success" | "warning" | "error";
type ShowToast = (options: {
  message: string;
  variant?: ToastVariant;
  dedupeKey?: string;
  title?: string;
}) => void;

type UseInterviewRoomFlowOptions = {
  step: InterviewStep;
  setupPayload: StartInterviewPayload;
  sessionId: string | null;
  uiError: string | null;
  isGuestUser: boolean;
  isExiting: boolean;
  isResumeResolving: boolean;
  showToast: ShowToast;
  showToastError: (message: string, dedupeKey?: string) => void;
  onSessionComplete: (targetSessionId: string, isGuestUser: boolean) => Promise<void> | void;
  setUiError: Dispatch<SetStateAction<string | null>>;
  setAuthPromptReason: (next: "auth_required" | null) => void;
};

type SubmitAnswerOptions = {
  answerOverride?: string;
  inputType?: "text" | "voice";
};

type UseInterviewRoomFlowResult = {
  questionOrder: number;
  followupCount: number;
  streamingQuestionText: string;
  isQuestionStreaming: boolean;
  messages: ChatMessage[];
  answerText: string;
  setAnswerText: (value: string) => void;
  isSubmitting: boolean;
  emotion: InterviewEmotion;
  avatarState: AvatarState;
  avatarCueToken: number;
  ttsAudioRef: RefObject<HTMLAudioElement>;
  isAutoplayBlocked: boolean;
  playTtsAudio: () => void;
  isRecording: boolean;
  isSttSupported: boolean;
  isSttBusy: boolean;
  handleToggleRecording: () => void;
  handleSubmitAnswer: (options?: SubmitAnswerOptions) => Promise<void>;
  handlePause: () => void;
  resetRoomState: (next: { questionOrder: number; followupCount: number; clearMessages?: boolean }) => void;
  setAvatarState: Dispatch<SetStateAction<AvatarState>>;
  clearAvatarCue: () => void;
  stopRecording: () => void;
  startQuestionStream: (targetSessionId: string) => void;
  stopQuestionStream: () => void;
  stopTtsPlayback: () => void;
};

export function useInterviewRoomFlow({
  step,
  setupPayload,
  sessionId,
  uiError,
  isGuestUser,
  isExiting,
  isResumeResolving,
  showToast,
  showToastError,
  onSessionComplete,
  setUiError,
  setAuthPromptReason
}: UseInterviewRoomFlowOptions): UseInterviewRoomFlowResult {
  const [streamingQuestionText, setStreamingQuestionText] = useState("");
  const [isQuestionStreaming, setIsQuestionStreaming] = useState(false);
  const [questionOrder, setQuestionOrder] = useState(1);
  const [followupCount, setFollowupCount] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [emotion, setEmotion] = useState<InterviewEmotion>("neutral");
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [activeAvatarCue, setActiveAvatarCue] = useState<AvatarTransientState | null>(null);
  const [avatarCueToken, setAvatarCueToken] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const avatarCueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uiErrorRef = useRef<string | null>(null);
  const lastFollowupCountRef = useRef(0);
  const {
    isRecording,
    isSupported: isSttSupported,
    speechError,
    startRecording,
    stopRecording,
    clearSpeechError
  } = useSpeechToText();

  useEffect(() => {
    uiErrorRef.current = uiError;
  }, [uiError]);

  const appendMessage = useCallback((nextMessage: ChatMessage) => {
    setMessages((previous) => [...previous, nextMessage]);
  }, []);

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

  const speakInterviewer = useCallback(
    (text: string) => rawSpeakInterviewer(text, setupPayload.character),
    [rawSpeakInterviewer, setupPayload.character]
  );

  const routeUiError = useCallback(
    (next: SetStateAction<string | null>) => {
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
    },
    [setAuthPromptReason, setUiError, showToastError]
  );

  const { stopQuestionStream, startQuestionStream } = useQuestionStreaming({
    stopTtsPlayback,
    appendMessage,
    speakInterviewer,
    setUiError: routeUiError,
    setIsQuestionStreaming,
    setStreamingQuestionText,
    setAvatarState,
    setQuestionOrder,
    setFollowupCount: (next) => {
      const resolved = typeof next === "function" ? next(lastFollowupCountRef.current) : next;
      lastFollowupCountRef.current = resolved;
      setFollowupCount(resolved);
    }
  });

  const isSttBusy = isRecording || isSubmitting || isQuestionStreaming || isExiting || isResumeResolving;

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

  const handleSubmitAnswer = useCallback(
    async (options?: SubmitAnswerOptions) => {
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
        const coachContent = [response.feedbackSummary, response.coaching]
          .map((item) => item?.trim())
          .filter((item): item is string => Boolean(item))
          .join("\n");

        if (coachContent) {
          appendMessage({
            id: `coach-${Date.now()}`,
            role: "coach",
            content: coachContent,
            tone: needsCoachWarning ? "error" : "default"
          });
        } else if (!response.coachingAvailable) {
          showToast({
            message: "코칭 생성이 지연되었습니다. 다음 답변으로 진행해 주세요.",
            variant: "info",
            dedupeKey: "coach:unavailable"
          });
        }

        if (response.isSessionComplete) {
          if (isGuestUser) {
            stopQuestionStream();
            stopTtsPlayback();
          }
          await onSessionComplete(sessionId, isGuestUser);
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
    },
    [
      appendMessage,
      answerText,
      clearAvatarCue,
      isGuestUser,
      isResumeResolving,
      isSubmitting,
      onSessionComplete,
      sessionId,
      setAuthPromptReason,
      setUiError,
      showToast,
      showToastError,
      startQuestionStream,
      stopQuestionStream,
      stopTtsPlayback,
      triggerAvatarCue
    ]
  );

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

  const resetRoomState = useCallback(
    (next: { questionOrder: number; followupCount: number; clearMessages?: boolean }) => {
      setQuestionOrder(next.questionOrder);
      setFollowupCount(next.followupCount);
      lastFollowupCountRef.current = next.followupCount;
      setStreamingQuestionText("");
      setIsQuestionStreaming(false);
      setAnswerText("");
      setEmotion("neutral");
      clearAvatarCue();
      setAvatarState("idle");
      if (next.clearMessages !== false) {
        setMessages([]);
      }
    },
    [clearAvatarCue]
  );

  const effectiveAvatarState = useMemo(() => activeAvatarCue ?? avatarState, [activeAvatarCue, avatarState]);

  return {
    questionOrder,
    followupCount,
    streamingQuestionText,
    isQuestionStreaming,
    messages,
    answerText,
    setAnswerText,
    isSubmitting,
    emotion,
    avatarState: effectiveAvatarState,
    avatarCueToken,
    ttsAudioRef,
    isAutoplayBlocked,
    playTtsAudio,
    isRecording,
    isSttSupported,
    isSttBusy,
    handleToggleRecording,
    handleSubmitAnswer,
    handlePause,
    resetRoomState,
    setAvatarState,
    clearAvatarCue,
    stopRecording: () => stopRecording(),
    startQuestionStream,
    stopQuestionStream,
    stopTtsPlayback
  };
}
