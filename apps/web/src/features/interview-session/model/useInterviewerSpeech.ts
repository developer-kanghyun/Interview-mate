"use client";

import { useCallback, useRef, useState, type MutableRefObject } from "react";
import { requestInterviewerSpeechUseCase } from "@/features/interview-session/model/application/requestInterviewerSpeechUseCase";
import {
  playBlobWithAudioElement,
  resetTtsAudioElement
} from "@/features/interview-session/model/interviewerSpeech.audio";
import { speakWithWebSpeech } from "@/features/interview-session/model/interviewerSpeech.web-speech";
import {
  type SetAvatarState,
  type UseInterviewerSpeechOptions,
  type UseInterviewerSpeechResult
} from "@/features/interview-session/model/interviewerSpeech.types";

export function useInterviewerSpeech(
  setAvatarState: SetAvatarState,
  options: UseInterviewerSpeechOptions = {}
): UseInterviewerSpeechResult {
  const onNotice = options.onNotice;
  const ttsAudioRef = useRef<HTMLAudioElement>(null);
  const ttsObjectUrlRef = useRef<string | null>(null);
  const ttsRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const autoplayNoticeShownRef = useRef(false);
  const fallbackNoticeShownRef = useRef(false);

  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);

  const pushNotice = useCallback(
    (message: string, onceRef?: MutableRefObject<boolean>) => {
      if (onceRef?.current) {
        return;
      }
      onNotice?.(message);
      if (onceRef) {
        onceRef.current = true;
      }
    },
    [onNotice]
  );

  const stopTtsPlayback = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const audioElement = ttsAudioRef.current;
    resetTtsAudioElement(audioElement);

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
        const response = await requestInterviewerSpeechUseCase({
          text: trimmedText,
          character,
          signal: abortController.signal
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          if (!abortController.signal.aborted) {
            const audioElement = ttsAudioRef.current;
            if (!audioElement) {
              throw new Error("TTS audio element가 없습니다.");
            }
            if (ttsObjectUrlRef.current) {
              URL.revokeObjectURL(ttsObjectUrlRef.current);
            }
            ttsObjectUrlRef.current = await playBlobWithAudioElement({
              audioElement,
              blob: audioBlob,
              signal: abortController.signal,
              onPlayed: () => setIsAutoplayBlocked(false),
              onAutoplayBlocked: () => {
                setIsAutoplayBlocked(true);
                pushNotice(
                  "브라우저 자동재생이 차단되었습니다. 우측의 '🔊 질문 듣기' 버튼을 눌러주세요.",
                  autoplayNoticeShownRef
                );
              }
            });
            playedFromBackend = true;
          }
        } else {
          pushNotice("TTS 서버 응답이 지연되어 브라우저 음성으로 재생합니다.", fallbackNoticeShownRef);
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          return;
        }
        pushNotice("TTS 서버 연결이 불안정하여 브라우저 음성으로 재생합니다.", fallbackNoticeShownRef);
      }

      if (!playedFromBackend && !abortController.signal.aborted && !isAutoplayBlocked) {
        try {
          await speakWithWebSpeech(trimmedText);
        } catch {
          pushNotice("음성 재생에 실패했습니다. '🔊 질문 듣기' 버튼을 다시 눌러주세요.");
        }
      }

      if (ttsRequestIdRef.current === requestId && !abortController.signal.aborted) {
        setAvatarState("listening");
      }
    },
    [isAutoplayBlocked, pushNotice, setAvatarState, stopTtsPlayback]
  );

  return {
    ttsAudioRef,
    stopTtsPlayback,
    speakInterviewer,
    isAutoplayBlocked,
    playTtsAudio
  };
}
