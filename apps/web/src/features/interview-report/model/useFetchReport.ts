"use client";

import { useCallback, useState } from "react";
import { getReport, type InterviewReport } from "@/shared/api/interview-client";
import { getAuthRequiredMessage } from "@/shared/auth/session";

type ReportFetchErrorCode = "auth_required" | "unknown";

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
      return await getReport(sessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "리포트 조회에 실패했습니다.";
      setReportFetchError(message);
      if (message === getAuthRequiredMessage()) {
        setReportFetchErrorCode("auth_required");
      } else {
        setReportFetchErrorCode("unknown");
      }
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
