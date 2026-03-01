import type { Dispatch, RefObject, SetStateAction } from "react";
import type {
  InterviewEmotion,
  StartInterviewPayload
} from "@/features/interview-session/model/application/interviewSessionUseCases";
import type { ChatMessage } from "@/shared/chat/ChatBoard";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";
import type { SubmitAnswerOptions } from "@/features/interview-session/model/useInterviewSubmitAnswer";

type ToastVariant = "info" | "success" | "warning" | "error";

export type ShowToast = (options: {
  message: string;
  variant?: ToastVariant;
  dedupeKey?: string;
  title?: string;
}) => void;

export type UseInterviewRoomFlowOptions = {
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

export type UseInterviewRoomFlowResult = {
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
