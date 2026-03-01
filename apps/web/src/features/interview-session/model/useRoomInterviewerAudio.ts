"use client";

import { useCallback } from "react";
import { useInterviewerSpeech } from "@/features/interview-session/model/useInterviewerSpeech";
import type { SetAvatarState } from "@/features/interview-session/model/interviewerSpeech.types";
import type { InterviewCharacter } from "@/features/interview-session/model/application/interviewSessionUseCases";
import type { ShowToast } from "@/features/interview-session/model/interviewRoom.types";

type UseRoomInterviewerAudioOptions = {
  setAvatarState: SetAvatarState;
  showToast: ShowToast;
  character: InterviewCharacter;
};

export function useRoomInterviewerAudio({
  setAvatarState,
  showToast,
  character
}: UseRoomInterviewerAudioOptions) {
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
    (text: string) => rawSpeakInterviewer(text, character),
    [character, rawSpeakInterviewer]
  );

  return {
    ttsAudioRef,
    stopTtsPlayback,
    isAutoplayBlocked,
    playTtsAudio,
    speakInterviewer
  };
}
