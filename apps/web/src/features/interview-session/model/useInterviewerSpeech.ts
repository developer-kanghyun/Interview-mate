"use client";

import { useCallback, useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { AvatarState } from "@/entities/avatar/ui/InterviewerAvatarAnimated";

type UseInterviewerSpeechResult = {
  ttsAudioRef: RefObject<HTMLAudioElement>;
  stopTtsPlayback: () => void;
  speakInterviewer: (text: string) => Promise<void>;
};

export function useInterviewerSpeech(
  setAvatarState: Dispatch<SetStateAction<AvatarState>>
): UseInterviewerSpeechResult {
  const ttsAudioRef = useRef<HTMLAudioElement>(null);
  const ttsObjectUrlRef = useRef<string | null>(null);
  const ttsRequestIdRef = useRef(0);

  const stopTtsPlayback = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const audioElement = ttsAudioRef.current;
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.removeAttribute("src");
      audioElement.load();
    }

    if (ttsObjectUrlRef.current) {
      URL.revokeObjectURL(ttsObjectUrlRef.current);
      ttsObjectUrlRef.current = null;
    }
  }, []);

  const playBlobWithAudioElement = useCallback(async (blob: Blob) => {
    const audioElement = ttsAudioRef.current;
    if (!audioElement) {
      throw new Error("TTS audio element가 없습니다.");
    }

    if (ttsObjectUrlRef.current) {
      URL.revokeObjectURL(ttsObjectUrlRef.current);
      ttsObjectUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(blob);
    ttsObjectUrlRef.current = objectUrl;
    audioElement.src = objectUrl;

    await audioElement.play();
    await new Promise<void>((resolve, reject) => {
      const handleEnded = () => {
        audioElement.removeEventListener("ended", handleEnded);
        audioElement.removeEventListener("error", handleError);
        resolve();
      };

      const handleError = () => {
        audioElement.removeEventListener("ended", handleEnded);
        audioElement.removeEventListener("error", handleError);
        reject(new Error("TTS 오디오 재생에 실패했습니다."));
      };

      audioElement.addEventListener("ended", handleEnded, { once: true });
      audioElement.addEventListener("error", handleError, { once: true });
    });
  }, []);

  const speakWithWebSpeech = useCallback(async (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";

    await new Promise<void>((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error("speechSynthesis 재생 실패"));
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const speakInterviewer = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText) {
        setAvatarState("listening");
        return;
      }

      const requestId = ttsRequestIdRef.current + 1;
      ttsRequestIdRef.current = requestId;
      setAvatarState("asking");
      stopTtsPlayback();

      const ttsEndpoint = process.env.NEXT_PUBLIC_TTS_ENDPOINT;
      const ttsVoice = process.env.NEXT_PUBLIC_TTS_VOICE;
      let played = false;

      try {
        if (ttsEndpoint) {
          const response = await fetch(ttsEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              text: trimmedText,
              voice: ttsVoice || undefined
            })
          });

          if (!response.ok) {
            throw new Error(`TTS endpoint 응답 실패: ${response.status}`);
          }

          const audioBlob = await response.blob();
          await playBlobWithAudioElement(audioBlob);
          played = true;
        }
      } catch {
        played = false;
      }

      if (!played) {
        try {
          await speakWithWebSpeech(trimmedText);
        } catch {
          // fallback 실패 시 조용히 종료
        }
      }

      if (ttsRequestIdRef.current === requestId) {
        setAvatarState("listening");
      }
    },
    [playBlobWithAudioElement, setAvatarState, speakWithWebSpeech, stopTtsPlayback]
  );

  return {
    ttsAudioRef,
    stopTtsPlayback,
    speakInterviewer
  };
}
