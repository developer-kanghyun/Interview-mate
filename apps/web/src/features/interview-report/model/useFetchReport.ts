"use client";

import { useCallback, useState } from "react";
import { getReport, type InterviewReport } from "@/shared/api/interview-client";

type UseFetchReportResult = {
  isFetchingReport: boolean;
  reportFetchError: string | null;
  fetchReport: (sessionId: string) => Promise<InterviewReport | null>;
  clearReportFetchError: () => void;
};

export function useFetchReport(): UseFetchReportResult {
  const [isFetchingReport, setIsFetchingReport] = useState(false);
  const [reportFetchError, setReportFetchError] = useState<string | null>(null);

  const fetchReport = useCallback(async (sessionId: string) => {
    setIsFetchingReport(true);
    setReportFetchError(null);
    try {
      return await getReport(sessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "리포트 조회에 실패했습니다.";
      setReportFetchError(message);
      return null;
    } finally {
      setIsFetchingReport(false);
    }
  }, []);

  const clearReportFetchError = useCallback(() => {
    setReportFetchError(null);
  }, []);

  return {
    isFetchingReport,
    reportFetchError,
    fetchReport,
    clearReportFetchError
  };
}
