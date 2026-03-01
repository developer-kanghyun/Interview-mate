"use client";

import {
  useCallback,
  useRef,
  useState
} from "react";
import { type InterviewEmotion } from "@/shared/api/interview-client";
import type { ChatMessage } from "@/shared/chat/ChatBoard";
import { useQuestionStreaming } from "@/features/interview-session/model/useQuestionStreaming";
import {
  useInterviewSubmitAnswer
} from "@/features/interview-session/model/useInterviewSubmitAnswer";
import { useSpeechToText } from "@/shared/lib/useSpeechToText";
import { useRoomAvatarCue } from "@/features/interview-session/model/useRoomAvatarCue";
import { useRoomInterviewerAudio } from "@/features/interview-session/model/useRoomInterviewerAudio";
import { useRoomRecordingController } from "@/features/interview-session/model/useRoomRecordingController";
import { useRoomLifecycleEffects } from "@/features/interview-session/model/useRoomLifecycleEffects";
import { useRoomSpeechErrorNotice } from "@/features/interview-session/model/useRoomSpeechErrorNotice";
import { useRoomUiErrorRouter } from "@/features/interview-session/model/useRoomUiErrorRouter";
import { useRoomStateReset } from "@/features/interview-session/model/useRoomStateReset";
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
  const lastFollowupCountRef = useRef(0);
  const {
    isRecording,
    isSupported: isSttSupported,
    speechError,
    startRecording,
    stopRecording,
    clearSpeechError
  } = useSpeechToText();

  const appendMessage = useCallback((nextMessage: ChatMessage) => {
    setMessages((previous) => [...previous, nextMessage]);
  }, []);

  const { ttsAudioRef, stopTtsPlayback, isAutoplayBlocked, playTtsAudio, speakInterviewer } = useRoomInterviewerAudio({
    setAvatarState,
    showToast,
    character: setupPayload.character
  });

  const routeUiError = useRoomUiErrorRouter({
    uiError,
    setUiError,
    setAuthPromptReason,
    showToastError
  });

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

  useRoomLifecycleEffects({
    step,
    isRecording,
    stopRecording,
    stopQuestionStream,
    stopTtsPlayback,
    clearAvatarCueTimer
  });

  useRoomSpeechErrorNotice({
    speechError,
    isSttSupported,
    showToast,
    clearSpeechError
  });

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

  const { isSttBusy, handleToggleRecording } = useRoomRecordingController({
    isRecording,
    isSubmitting,
    isQuestionStreaming,
    isExiting,
    isResumeResolving,
    showToast,
    startRecording,
    stopRecording,
    clearSpeechError,
    clearAvatarCue,
    setAvatarState: (state) => setAvatarState(state),
    setAnswerText,
    handleSubmitAnswer
  });
  const { handlePause, resetRoomState } = useRoomStateReset({
    clearAvatarCue,
    setAvatarState: (state) => setAvatarState(state),
    appendMessage,
    setQuestionOrder,
    setFollowupCount,
    lastFollowupCountRef,
    setStreamingQuestionText,
    setIsQuestionStreaming,
    setAnswerText,
    setEmotionNeutral: () => setEmotion("neutral"),
    setMessages
  });

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
