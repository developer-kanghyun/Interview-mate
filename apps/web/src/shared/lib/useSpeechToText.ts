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

    const recognition = new recognitionConstructor();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript.trim()) {
        onTranscript(transcript.trim());
      }
    };

    recognition.onerror = () => {
      setSpeechError("음성 인식에 실패했습니다. 텍스트 입력으로 진행해 주세요.");
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setSpeechError("");
    setIsRecording(true);
  }, [recognitionConstructor]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
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
