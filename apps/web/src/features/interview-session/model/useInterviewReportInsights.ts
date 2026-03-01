"use client";

import { useCallback, useMemo, useState } from "react";
import {
  listInterviewSessionsUseCase,
  type InterviewReport,
  type SessionHistoryItem,
  type StartInterviewPayload
} from "@/features/interview-session/model/application/interviewSessionUseCases";
import { useFetchReport } from "@/features/interview-report/model/useFetchReport";
import type {
  UseInterviewReportInsightsOptions,
  UseInterviewReportInsightsResult
} from "@/features/interview-session/model/interviewReportInsights.types";
import { useMoveToReport } from "@/features/interview-session/model/useMoveToReport";
import { buildWeakRetryPayloads } from "@/features/interview-session/model/interviewReportInsights.utils";
import { selectReportInsightsSummary } from "@/features/interview-session/model/interviewReportInsights.selectors";

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

  const moveToReport = useMoveToReport({
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
  });

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
    syncPathname("/study");
    setStep("insights");
    setIsInsightsLoading(true);

    try {
      const sessionList = await listInterviewSessionsUseCase(30);
      setSessions(sessionList);
    } catch (error) {
      const message = error instanceof Error ? error.message : "세션 목록 조회에 실패했습니다.";
      setInsightsErrorMessage(message);
    } finally {
      setIsInsightsLoading(false);
    }
  }, [isInsightsLoading, setAuthPromptReason, setStep, setUiError, syncPathname]);

  const { weakKeywords, studyGuide, questionGuides } = useMemo(
    () => selectReportInsightsSummary(report),
    [report]
  );

  const handleRetryWeakness = useCallback(async () => {
    if (isRetryingWeakness || isStarting) {
      return;
    }
    if (!report?.sessionId) {
      showToastError("현재 리포트 세션 정보를 찾을 수 없습니다. 다시 시도해 주세요.", "retry:missing-source-session");
      return;
    }

    const retryPreset = buildRetryPreset(weakKeywords, setupPayload);
    const { retryPayloadForSetup, retryPayloadForStart } = buildWeakRetryPayloads({
      setupPayload,
      report,
      retryPreset
    });

    setIsRetryingWeakness(true);
    try {
      syncPathname("/setup");
      setStep("setup");
      setSetupPayload(retryPayloadForSetup);
      await onRetryInterview(retryPayloadForStart);
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
    weakKeywords,
    showToastError
  ]);

  return {
    report,
    sessions,
    weakKeywords,
    studyGuide,
    questionGuides,
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
