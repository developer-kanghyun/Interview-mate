"use client";

import { useCallback, useMemo, useRef, useState } from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function useSpeechToText() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [speechError, setSpeechError] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptHandlerRef = useRef<((text: string) => void) | null>(null);
  const manualStopHandlerRef = useRef<((text: string) => void) | null>(null);
  const latestTranscriptRef = useRef("");
  const shouldKeepAliveRef = useRef(false);
  const manualStopRequestedRef = useRef(false);

  const recognitionConstructor = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const speechWindow = window as SpeechRecognitionWindow;
    return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
  }, []);

  const startRecording = useCallback((onTranscript: (text: string) => void) => {
    if (!recognitionConstructor) {
      setIsSupported(false);
      setSpeechError("이 브라우저는 STT를 지원하지 않습니다.");
      return;
    }

    if (shouldKeepAliveRef.current) {
      return;
    }

    transcriptHandlerRef.current = onTranscript;
    manualStopHandlerRef.current = null;
    latestTranscriptRef.current = "";
    manualStopRequestedRef.current = false;
    shouldKeepAliveRef.current = true;
    setSpeechError("");

    const recognition = new recognitionConstructor();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || "";
      if (!transcript) {
        return;
      }
      latestTranscriptRef.current = transcript;
      transcriptHandlerRef.current?.(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const fatalErrors = new Set(["not-allowed", "audio-capture", "service-not-allowed"]);
      if (fatalErrors.has(event.error)) {
        shouldKeepAliveRef.current = false;
      }
      setSpeechError("음성 인식에 실패했습니다. 텍스트 입력으로 진행해 주세요.");
      setIsRecording(false);
    };

    recognition.onend = () => {
      if (manualStopRequestedRef.current) {
        const finalTranscript = latestTranscriptRef.current.trim();
        const onManualStop = manualStopHandlerRef.current;

        shouldKeepAliveRef.current = false;
        manualStopRequestedRef.current = false;
        manualStopHandlerRef.current = null;
        transcriptHandlerRef.current = null;
        recognitionRef.current = null;
        setIsRecording(false);

        onManualStop?.(finalTranscript);
        return;
      }

      if (!shouldKeepAliveRef.current || recognitionRef.current !== recognition) {
        setIsRecording(false);
        recognitionRef.current = null;
        return;
      }

      window.setTimeout(() => {
        if (!shouldKeepAliveRef.current || manualStopRequestedRef.current || recognitionRef.current !== recognition) {
          return;
        }

        try {
          recognition.start();
        } catch {
          shouldKeepAliveRef.current = false;
          setIsRecording(false);
          setSpeechError("음성 인식 재시작에 실패했습니다. 다시 시도해 주세요.");
        }
      }, 0);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      shouldKeepAliveRef.current = false;
      recognitionRef.current = null;
      setIsRecording(false);
      setSpeechError("음성 인식을 시작할 수 없습니다. 다시 시도해 주세요.");
    }
  }, [recognitionConstructor]);

  const stopRecording = useCallback((onManualStop?: (text: string) => void) => {
    shouldKeepAliveRef.current = false;
    manualStopRequestedRef.current = true;
    manualStopHandlerRef.current = onManualStop ?? null;

    if (!recognitionRef.current) {
      setIsRecording(false);
      const transcript = latestTranscriptRef.current.trim();
      manualStopHandlerRef.current?.(transcript);
      manualStopHandlerRef.current = null;
      manualStopRequestedRef.current = false;
      return;
    }

    try {
      recognitionRef.current.stop();
    } catch {
      const transcript = latestTranscriptRef.current.trim();
      setIsRecording(false);
      recognitionRef.current = null;
      manualStopRequestedRef.current = false;
      manualStopHandlerRef.current?.(transcript);
      manualStopHandlerRef.current = null;
    }
  }, []);

  const clearSpeechError = useCallback(() => {
    setSpeechError("");
  }, []);

  return {
    isRecording,
    isSupported,
    speechError,
    startRecording,
    stopRecording,
    clearSpeechError
  };
}
