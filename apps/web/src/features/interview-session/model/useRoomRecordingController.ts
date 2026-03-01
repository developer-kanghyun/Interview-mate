"use client";

import { useCallback } from "react";
import type { SubmitAnswerOptions } from "@/features/interview-session/model/useInterviewSubmitAnswer";
import type { ShowToast } from "@/features/interview-session/model/interviewRoom.types";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";

type UseRoomRecordingControllerOptions = {
  isRecording: boolean;
  isSubmitting: boolean;
  isQuestionStreaming: boolean;
  isExiting: boolean;
  isResumeResolving: boolean;
  showToast: ShowToast;
  startRecording: (onTranscript: (text: string) => void) => void;
  stopRecording: (onManualStop?: (text: string) => void) => void;
  clearSpeechError: () => void;
  clearAvatarCue: () => void;
  setAvatarState: (state: AvatarState) => void;
  setAnswerText: (value: string) => void;
  handleSubmitAnswer: (options?: SubmitAnswerOptions) => Promise<void>;
};

export function useRoomRecordingController({
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
  setAvatarState,
  setAnswerText,
  handleSubmitAnswer
}: UseRoomRecordingControllerOptions) {
  const isSttBusy = isRecording || isSubmitting || isQuestionStreaming || isExiting || isResumeResolving;

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
    setAnswerText,
    showToast,
    startRecording,
    stopRecording
  ]);

  return { isSttBusy, handleToggleRecording };
}
