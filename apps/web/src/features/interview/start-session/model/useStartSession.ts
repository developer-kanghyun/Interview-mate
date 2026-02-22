"use client";

import { useCallback, useRef, useState } from "react";
import { startInterview, type StartInterviewPayload } from "@/shared/api/interview-client";

export function useStartSession() {
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const startInFlightRef = useRef(false);

  const startSession = useCallback(async (payload: StartInterviewPayload) => {
    if (startInFlightRef.current) {
      return null;
    }

    startInFlightRef.current = true;
    setIsStarting(true);
    setStartError(null);
    try {
      return await startInterview(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "면접 시작에 실패했습니다.";
      setStartError(message);
      throw error;
    } finally {
      startInFlightRef.current = false;
      setIsStarting(false);
    }
  }, []);

  const clearStartError = useCallback(() => {
    setStartError(null);
  }, []);

  return {
    isStarting,
    startError,
    startSession,
    clearStartError
  };
}
