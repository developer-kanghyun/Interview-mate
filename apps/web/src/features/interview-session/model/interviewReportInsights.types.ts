import type {
  InterviewReport,
  ReportQuestionGuide,
  SessionHistoryItem,
  StartInterviewPayload
} from "@/features/interview-session/model/application/interviewSessionUseCases";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

export type UseInterviewReportInsightsOptions = {
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
  buildRetryPreset: (weakKeywords: string[], fallback: StartInterviewPayload) => {
    jobRole?: StartInterviewPayload["jobRole"];
    stack?: StartInterviewPayload["stack"];
  };
};

export type UseInterviewReportInsightsResult = {
  report: InterviewReport | null;
  sessions: SessionHistoryItem[];
  weakKeywords: string[];
  studyGuide: string[];
  questionGuides: ReportQuestionGuide[];
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
