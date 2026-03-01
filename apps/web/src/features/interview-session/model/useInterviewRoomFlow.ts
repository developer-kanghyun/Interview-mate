"use client";

import { useCallback } from "react";
import type { ChatMessage } from "@/shared/chat/ChatBoard";
import { useQuestionStreaming } from "@/features/interview-session/model/useQuestionStreaming";
import {
  useInterviewSubmitAnswer
} from "@/features/interview-session/model/useInterviewSubmitAnswer";
import { useRoomInterviewerAudio } from "@/features/interview-session/model/useRoomInterviewerAudio";
import { useRoomRecordingController } from "@/features/interview-session/model/useRoomRecordingController";
import { useRoomLifecycleEffects } from "@/features/interview-session/model/useRoomLifecycleEffects";
import { useRoomSpeechErrorNotice } from "@/features/interview-session/model/useRoomSpeechErrorNotice";
import { useRoomUiErrorRouter } from "@/features/interview-session/model/useRoomUiErrorRouter";
import { useRoomStateReset } from "@/features/interview-session/model/useRoomStateReset";
import { useInterviewRoomFlowState } from "@/features/interview-session/model/useInterviewRoomFlowState";
import type { UseInterviewRoomFlowOptions, UseInterviewRoomFlowResult } from "@/features/interview-session/model/interviewRoom.types";

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
  const { streamingQuestionText, setStreamingQuestionText, isQuestionStreaming, setIsQuestionStreaming, questionOrder, setQuestionOrder, followupCount, setFollowupCount, answerText, setAnswerText, messages, setMessages, emotion, setEmotion, avatarState, setAvatarState, effectiveAvatarState, avatarCueToken, triggerAvatarCue, clearAvatarCue, clearAvatarCueTimer, isSubmitting, setIsSubmitting, lastFollowupCountRef, isRecording, isSttSupported, speechError, startRecording, stopRecording, clearSpeechError } =
    useInterviewRoomFlowState();

  const appendMessage = useCallback((nextMessage: ChatMessage) => {
    setMessages((previous) => [...previous, nextMessage]);
  }, [setMessages]);

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
