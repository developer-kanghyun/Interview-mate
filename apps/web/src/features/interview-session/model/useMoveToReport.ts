"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  listInterviewSessionsUseCase,
  type InterviewReport,
  type SessionHistoryItem
} from "@/features/interview-session/model/application/interviewSessionUseCases";
import { clearStoredSessionId } from "@/shared/auth/session";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

type UseMoveToReportOptions = {
  isExiting: boolean;
  setIsExiting: (next: boolean) => void;
  onBeforeMoveToReport: () => void;
  setUiError: (next: string | null) => void;
  setAuthPromptReason: (next: "auth_required" | null) => void;
  clearReportFetchError: () => void;
  syncPathname: (nextPath: string, mode?: "push" | "replace") => void;
  setStep: (next: InterviewStep) => void;
  setReport: Dispatch<SetStateAction<InterviewReport | null>>;
  setSessions: Dispatch<SetStateAction<SessionHistoryItem[]>>;
  fetchReport: (sessionId: string) => Promise<InterviewReport | null>;
  onReportResolved: (report: InterviewReport) => void;
  showToastError: (message: string, dedupeKey?: string) => void;
};

export function useMoveToReport({
  isExiting,
  setIsExiting,
  onBeforeMoveToReport,
  setUiError,
  setAuthPromptReason,
  clearReportFetchError,
  syncPathname,
  setStep,
  setReport,
  setSessions,
  fetchReport,
  onReportResolved,
  showToastError
}: UseMoveToReportOptions) {
  return useCallback(
    async (targetSessionId: string) => {
      if (isExiting) {
        return;
      }

      setIsExiting(true);
      onBeforeMoveToReport();
      setUiError(null);
      setAuthPromptReason(null);
      clearReportFetchError();
      syncPathname(`/report/${encodeURIComponent(targetSessionId)}`);
      setStep("report");
      setReport(null);

      try {
        const sessionsPromise = listInterviewSessionsUseCase(30);
        const nextReport = await fetchReport(targetSessionId);

        try {
          const nextSessions = await sessionsPromise;
          setSessions(nextSessions);
        } catch (error) {
          const message = error instanceof Error ? error.message : "세션 목록 조회에 실패했습니다.";
          showToastError(message, "sessions:list");
        }

        if (!nextReport) {
          return;
        }

        setReport(nextReport);
        onReportResolved(nextReport);
        clearStoredSessionId();
      } catch (error) {
        const message = error instanceof Error ? error.message : "리포트 조회에 실패했습니다.";
        showToastError(message, "report:move");
      } finally {
        setIsExiting(false);
      }
    },
    [
      clearReportFetchError,
      fetchReport,
      isExiting,
      onBeforeMoveToReport,
      onReportResolved,
      setAuthPromptReason,
      setIsExiting,
      setReport,
      setSessions,
      setStep,
      setUiError,
      showToastError,
      syncPathname
    ]
  );
}
