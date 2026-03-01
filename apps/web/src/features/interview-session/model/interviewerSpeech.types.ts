import type { Dispatch, RefObject, SetStateAction } from "react";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";

export type UseInterviewerSpeechOptions = {
  onNotice?: (message: string) => void;
};

export type UseInterviewerSpeechResult = {
  ttsAudioRef: RefObject<HTMLAudioElement>;
  stopTtsPlayback: () => void;
  speakInterviewer: (text: string, character?: string) => Promise<void>;
  isAutoplayBlocked: boolean;
  playTtsAudio: () => void;
};

export type SetAvatarState = Dispatch<SetStateAction<AvatarState>>;
