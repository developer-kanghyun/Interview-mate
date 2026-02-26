"use client";

import { useCallback, useMemo, useState } from "react";
import {
  listSessions,
  type InterviewReport,
  type SessionHistoryItem,
  type StartInterviewPayload
} from "@/shared/api/interview-client";
import { clearStoredSessionId } from "@/shared/auth/session";
import { useFetchReport } from "@/features/interview-report/model/useFetchReport";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

type RetryPreset = {
  jobRole?: StartInterviewPayload["jobRole"];
  stack?: StartInterviewPayload["stack"];
};

type UseInterviewReportInsightsOptions = {
  sessionId: string | null;
  setupPayload: StartInterviewPayload;
  setSetupPayload: (next: StartInterviewPayload) => void;
  setStep: (next: InterviewStep) => void;
  syncPathname: (nextPath: string, mode?: "push" | "replace") => void;
  isStarting: boolean;
  isExiting: boolean;
  setIsExiting: (next: boolean) => void;
  setUiError: (next: string | null) => void;
  setAuthPromptReason: (next: "auth_required" | null) => void;
  showToastError: (message: string, dedupeKey?: string) => void;
  onBeforeMoveToReport: () => void;
  onReportResolved: (report: InterviewReport) => void;
  onRetryInterview: (payload: StartInterviewPayload) => Promise<void>;
  buildRetryPreset: (weakKeywords: string[], fallback: StartInterviewPayload) => RetryPreset;
};

type UseInterviewReportInsightsResult = {
  report: InterviewReport | null;
  sessions: SessionHistoryItem[];
  weakKeywords: string[];
  studyGuide: string[];
  isInsightsLoading: boolean;
  insightsErrorMessage: string | null;
  isRetryingWeakness: boolean;
  isReportLoading: boolean;
  reportErrorMessage: string | null;
  reportErrorCode: "auth_required" | "unknown" | null;
  clearReportFetchError: () => void;
  resetReportState: () => void;
  moveToReport: (targetSessionId: string) => Promise<void>;
  handleRetryReport: () => Promise<void>;
  handleGoInsights: () => Promise<void>;
  handleRetryWeakness: () => Promise<void>;
};

export function useInterviewReportInsights({
  sessionId,
  setupPayload,
  setSetupPayload,
  setStep,
  syncPathname,
  isStarting,
  isExiting,
  setIsExiting,
  setUiError,
  setAuthPromptReason,
  showToastError,
  onBeforeMoveToReport,
  onReportResolved,
  onRetryInterview,
  buildRetryPreset
}: UseInterviewReportInsightsOptions): UseInterviewReportInsightsResult {
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [insightsErrorMessage, setInsightsErrorMessage] = useState<string | null>(null);
  const [isRetryingWeakness, setIsRetryingWeakness] = useState(false);
  const { isFetchingReport, reportFetchError, reportFetchErrorCode, fetchReport, clearReportFetchError } =
    useFetchReport();
  const resetReportState = useCallback(() => {
    setReport(null);
  }, []);

  const moveToReport = useCallback(
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
        const sessionsPromise = listSessions(30);
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
      setStep,
      setUiError,
      showToastError,
      syncPathname
    ]
  );

  const handleRetryReport = useCallback(async () => {
    if (!sessionId) {
      showToastError("세션 정보가 없어 리포트를 다시 조회할 수 없습니다.", "report:retry-without-session");
      return;
    }

    await moveToReport(sessionId);
  }, [moveToReport, sessionId, showToastError]);

  const handleGoInsights = useCallback(async () => {
    if (isInsightsLoading) {
      return;
    }

    setUiError(null);
    setAuthPromptReason(null);
    setInsightsErrorMessage(null);
    syncPathname("/insights");
    setStep("insights");
    setIsInsightsLoading(true);

    try {
      const sessionList = await listSessions(30);
      setSessions(sessionList);
    } catch (error) {
      const message = error instanceof Error ? error.message : "세션 목록 조회에 실패했습니다.";
      setInsightsErrorMessage(message);
    } finally {
      setIsInsightsLoading(false);
    }
  }, [isInsightsLoading, setAuthPromptReason, setStep, setUiError, syncPathname]);

  const weakKeywords = useMemo(() => report?.weakKeywords ?? [], [report]);
  const studyGuide = useMemo(
    () =>
      report?.studyGuide ?? [
        "답변을 결론-근거-예시 순서로 구조화하세요.",
        "약점 키워드 위주로 재연습 세션을 반복하세요."
      ],
    [report]
  );

  const handleRetryWeakness = useCallback(async () => {
    if (isRetryingWeakness || isStarting) {
      return;
    }

    const retryPreset = buildRetryPreset(weakKeywords, setupPayload);
    const retryPayload: StartInterviewPayload = {
      ...setupPayload,
      ...retryPreset,
      difficulty: report && report.totalScore >= 70 ? "junior" : "jobseeker",
      questionCount: Math.min(setupPayload.questionCount, 5)
    };

    setIsRetryingWeakness(true);
    try {
      syncPathname("/setup");
      setStep("setup");
      setSetupPayload(retryPayload);
      await onRetryInterview(retryPayload);
    } finally {
      setIsRetryingWeakness(false);
    }
  }, [
    buildRetryPreset,
    isRetryingWeakness,
    isStarting,
    onRetryInterview,
    report,
    setSetupPayload,
    setStep,
    setupPayload,
    syncPathname,
    weakKeywords
  ]);

  return {
    report,
    sessions,
    weakKeywords,
    studyGuide,
    isInsightsLoading,
    insightsErrorMessage,
    isRetryingWeakness,
    isReportLoading: isFetchingReport,
    reportErrorMessage: reportFetchError,
    reportErrorCode: reportFetchErrorCode,
    clearReportFetchError,
    resetReportState,
    moveToReport,
    handleRetryReport,
    handleGoInsights,
    handleRetryWeakness
  };
}
