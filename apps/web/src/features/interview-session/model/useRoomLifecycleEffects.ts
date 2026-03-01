"use client";

import { useEffect } from "react";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

type UseRoomLifecycleEffectsOptions = {
  step: InterviewStep;
  isRecording: boolean;
  stopRecording: (onManualStop?: (text: string) => void) => void;
  stopQuestionStream: () => void;
  stopTtsPlayback: () => void;
  clearAvatarCueTimer: () => void;
};

export function useRoomLifecycleEffects({
  step,
  isRecording,
  stopRecording,
  stopQuestionStream,
  stopTtsPlayback,
  clearAvatarCueTimer
}: UseRoomLifecycleEffectsOptions) {
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
}
