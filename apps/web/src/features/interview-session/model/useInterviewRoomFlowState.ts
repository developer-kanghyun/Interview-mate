import { useRef, useState } from "react";
import { type InterviewEmotion } from "@/features/interview-session/model/application/interviewSessionUseCases";
import type { ChatMessage } from "@/shared/chat/ChatBoard";
import { useSpeechToText } from "@/shared/lib/useSpeechToText";
import { useRoomAvatarCue } from "@/features/interview-session/model/useRoomAvatarCue";

export function useInterviewRoomFlowState() {
  const [streamingQuestionText, setStreamingQuestionText] = useState("");
  const [isQuestionStreaming, setIsQuestionStreaming] = useState(false);
  const [questionOrder, setQuestionOrder] = useState(1);
  const [followupCount, setFollowupCount] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [emotion, setEmotion] = useState<InterviewEmotion>("neutral");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastFollowupCountRef = useRef(0);
  const {
    avatarState,
    setAvatarState,
    effectiveAvatarState,
    avatarCueToken,
    triggerAvatarCue,
    clearAvatarCue,
    clearAvatarCueTimer
  } = useRoomAvatarCue();
  const {
    isRecording,
    isSupported: isSttSupported,
    speechError,
    startRecording,
    stopRecording,
    clearSpeechError
  } = useSpeechToText();

  return {
    streamingQuestionText,
    setStreamingQuestionText,
    isQuestionStreaming,
    setIsQuestionStreaming,
    questionOrder,
    setQuestionOrder,
    followupCount,
    setFollowupCount,
    answerText,
    setAnswerText,
    messages,
    setMessages,
    emotion,
    setEmotion,
    avatarState,
    setAvatarState,
    effectiveAvatarState,
    avatarCueToken,
    triggerAvatarCue,
    clearAvatarCue,
    clearAvatarCueTimer,
    isSubmitting,
    setIsSubmitting,
    lastFollowupCountRef,
    isRecording,
    isSttSupported,
    speechError,
    startRecording,
    stopRecording,
    clearSpeechError
  };
}
