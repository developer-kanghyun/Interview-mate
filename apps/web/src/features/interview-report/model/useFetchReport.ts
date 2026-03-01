"use client";

import { useCallback, useState } from "react";
import {
  fetchInterviewReportUseCase,
  type InterviewReport
} from "@/features/interview-report/model/application/fetchInterviewReportUseCase";
import {
  classifyReportFetchError,
  type ReportFetchErrorCode
} from "@/features/interview-report/model/domain/reportError";

type UseFetchReportResult = {
  isFetchingReport: boolean;
  reportFetchError: string | null;
  reportFetchErrorCode: ReportFetchErrorCode | null;
  fetchReport: (sessionId: string) => Promise<InterviewReport | null>;
  clearReportFetchError: () => void;
};

export function useFetchReport(): UseFetchReportResult {
  const [isFetchingReport, setIsFetchingReport] = useState(false);
  const [reportFetchError, setReportFetchError] = useState<string | null>(null);
  const [reportFetchErrorCode, setReportFetchErrorCode] = useState<ReportFetchErrorCode | null>(null);

  const fetchReport = useCallback(async (sessionId: string) => {
    setIsFetchingReport(true);
    setReportFetchError(null);
    setReportFetchErrorCode(null);
    try {
      return await fetchInterviewReportUseCase(sessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "리포트 조회에 실패했습니다.";
      setReportFetchError(message);
      setReportFetchErrorCode(classifyReportFetchError(message));
      return null;
    } finally {
      setIsFetchingReport(false);
    }
  }, []);

  const clearReportFetchError = useCallback(() => {
    setReportFetchError(null);
    setReportFetchErrorCode(null);
  }, []);

  return {
    isFetchingReport,
    reportFetchError,
    reportFetchErrorCode,
    fetchReport,
    clearReportFetchError
  };
}
