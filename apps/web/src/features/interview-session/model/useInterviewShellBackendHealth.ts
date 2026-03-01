"use client";

import { useCallback } from "react";
import { checkInterviewBackendHealthUseCase } from "@/features/interview-session/model/application/interviewSessionUseCases";

type BackendStatus = "checking" | "ok" | "error";

type UseInterviewShellBackendHealthOptions = {
  setBackendStatus: (next: BackendStatus) => void;
  setBackendStatusMessage: (next: string | null) => void;
};

export function useInterviewShellBackendHealth({
  setBackendStatus,
  setBackendStatusMessage
}: UseInterviewShellBackendHealthOptions) {
  return useCallback(async () => {
    setBackendStatus("checking");
    setBackendStatusMessage(null);
    try {
      await checkInterviewBackendHealthUseCase();
      setBackendStatus("ok");
    } catch (error) {
      const message = error instanceof Error ? error.message : "백엔드 연결 확인에 실패했습니다.";
      setBackendStatus("error");
      setBackendStatusMessage(message);
    }
  }, [setBackendStatus, setBackendStatusMessage]);
}
