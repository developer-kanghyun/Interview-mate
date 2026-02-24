"use client";

import { useCallback, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { AvatarState } from "@/entities/avatar/ui/InterviewerAvatarAnimated";

type UseInterviewerSpeechResult = {
  ttsAudioRef: RefObject<HTMLAudioElement>;
  stopTtsPlayback: () => void;
  speakInterviewer: (text: string, character?: string) => Promise<void>;
  isAutoplayBlocked: boolean;
  playTtsAudio: () => void;
};

export function useInterviewerSpeech(
  setAvatarState: Dispatch<SetStateAction<AvatarState>>
): UseInterviewerSpeechResult {
  const ttsAudioRef = useRef<HTMLAudioElement>(null);
  const ttsObjectUrlRef = useRef<string | null>(null);
  const ttsRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);

  const stopTtsPlayback = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

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

  const playTtsAudio = useCallback(() => {
    const audioElement = ttsAudioRef.current;
    if (audioElement && audioElement.src) {
      setIsAutoplayBlocked(false);
      audioElement.play().catch(console.error);
    }
  }, []);

  const playBlobWithAudioElement = useCallback(async (blob: Blob, signal: AbortSignal) => {
    const audioElement = ttsAudioRef.current;
    if (!audioElement) {
      throw new Error("TTS audio element가 없습니다.");
    }

    if (ttsObjectUrlRef.current) {
      URL.revokeObjectURL(ttsObjectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(blob);
    ttsObjectUrlRef.current = objectUrl;
    audioElement.src = objectUrl;

    try {
      await audioElement.play();
      setIsAutoplayBlocked(false);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setIsAutoplayBlocked(true);
      }
      throw err;
    }

    await new Promise<void>((resolve, reject) => {
      const handleEnded = () => {
        cleanup();
        resolve();
      };

      const handleError = () => {
        cleanup();
        reject(new Error("TTS 오디오 재생에 실패했습니다."));
      };
      
      const handleAbort = () => {
        cleanup();
        resolve();
      };
      
      const cleanup = () => {
        audioElement.removeEventListener("ended", handleEnded);
        audioElement.removeEventListener("error", handleError);
        signal.removeEventListener("abort", handleAbort);
      };

      audioElement.addEventListener("ended", handleEnded, { once: true });
      audioElement.addEventListener("error", handleError, { once: true });
      signal.addEventListener("abort", handleAbort, { once: true });
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
    async (text: string, character = "zet") => {
      const trimmedText = text.trim();
      if (!trimmedText) {
        setAvatarState("listening");
        return;
      }

      const requestId = ttsRequestIdRef.current + 1;
      ttsRequestIdRef.current = requestId;
      
      stopTtsPlayback();
      
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setAvatarState("asking");

      let playedFromBackend = false;

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: trimmedText,
            character: character
          }),
          signal: abortController.signal
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          if (!abortController.signal.aborted) {
            await playBlobWithAudioElement(audioBlob, abortController.signal);
            playedFromBackend = true;
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          return;
        }
      }

      if (!playedFromBackend && !abortController.signal.aborted && !isAutoplayBlocked) {
        try {
          await speakWithWebSpeech(trimmedText);
        } catch {
          // fallback 실패 시 조용히 종료
        }
      }

      if (ttsRequestIdRef.current === requestId && !abortController.signal.aborted) {
        setAvatarState("listening");
      }
    },
    [playBlobWithAudioElement, setAvatarState, speakWithWebSpeech, stopTtsPlayback, isAutoplayBlocked]
  );

  return {
    ttsAudioRef,
    stopTtsPlayback,
    speakInterviewer,
    isAutoplayBlocked,
    playTtsAudio
  };
}
