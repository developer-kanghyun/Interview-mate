"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction
} from "react";
import { type InterviewEmotion } from "@/shared/api/interview-client";
import type { ChatMessage } from "@/shared/chat/ChatBoard";
import { useInterviewerSpeech } from "@/features/interview-session/model/useInterviewerSpeech";
import { useQuestionStreaming } from "@/features/interview-session/model/useQuestionStreaming";
import {
  useInterviewSubmitAnswer
} from "@/features/interview-session/model/useInterviewSubmitAnswer";
import { useSpeechToText } from "@/shared/lib/useSpeechToText";
import {
  createPauseMessage
} from "@/features/interview-session/model/interviewRoom.utils";
import { getAuthRequiredMessage } from "@/shared/auth/session";
import { useRoomAvatarCue } from "@/features/interview-session/model/useRoomAvatarCue";
import type {
  UseInterviewRoomFlowOptions,
  UseInterviewRoomFlowResult
} from "@/features/interview-session/model/interviewRoom.types";

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
  const {
    avatarState,
    setAvatarState,
    effectiveAvatarState,
    avatarCueToken,
    triggerAvatarCue,
    clearAvatarCue,
    clearAvatarCueTimer
  } = useRoomAvatarCue();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      clearAvatarCueTimer();
    };
  }, [clearAvatarCueTimer, stopQuestionStream, stopRecording, stopTtsPlayback]);

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

  const handleSubmitAnswer = useInterviewSubmitAnswer({
    sessionId,
    answerText,
    isSubmitting,
    isResumeResolving,
    isGuestUser,
    setAnswerText,
    setIsSubmitting,
    setAvatarState,
    setEmotion,
    setFollowupCount,
    setUiError,
    setAuthPromptReason,
    lastFollowupCountRef,
    appendMessage,
    clearAvatarCue,
    triggerAvatarCue,
    showToast,
    showToastError,
    startQuestionStream,
    stopQuestionStream,
    stopTtsPlayback,
    onSessionComplete
  });

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
    setAvatarState,
    showToast,
    startRecording,
    stopRecording
  ]);

  const handlePause = useCallback(() => {
    clearAvatarCue();
    setAvatarState("idle");
    appendMessage(createPauseMessage());
  }, [appendMessage, clearAvatarCue, setAvatarState]);

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
    [clearAvatarCue, setAvatarState]
  );

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
