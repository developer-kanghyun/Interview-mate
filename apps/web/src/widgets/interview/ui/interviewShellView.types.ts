import type {
  InterviewReport,
  ReportQuestionGuide,
  SessionHistoryItem,
  StartInterviewPayload
} from "@/features/interview-session/model/application/interviewSessionUseCases";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

export type InterviewShellViewState = {
  step: InterviewStep;
  setStep: (next: InterviewStep) => void;
  uiError: string | null;
  clearUiError: () => void;
  handleRetryUiError: () => Promise<void>;
  isMemberAuthenticated: boolean;
  isAuthRequired: boolean;
  authRedirectTarget: string;
  handleGoogleLogin: (redirectTo?: string) => Promise<void>;
  handleGoogleLogout: () => Promise<void>;
  isAuthLoading: boolean;
  backendStatus: "checking" | "ok" | "error";
  backendStatusMessage: string | null;
  retryBackendHealthCheck: () => Promise<void>;
  setupPayload: StartInterviewPayload;
  setSetupPayload: (next: StartInterviewPayload) => void;
  isStarting: boolean;
  handleStartInterview: () => Promise<void>;
  report: InterviewReport | null;
  isReportLoading: boolean;
  reportErrorMessage: string | null;
  reportErrorCode: "auth_required" | "unknown" | null;
  handleRetryReport: () => Promise<void>;
  handleGoInsights: () => Promise<void>;
  isInsightsLoading: boolean;
  insightsErrorMessage: string | null;
  sessions: SessionHistoryItem[];
  weakKeywords: string[];
  studyGuide: string[];
  questionGuides: ReportQuestionGuide[];
  isRetryingWeakness: boolean;
  handleRetryWeakness: () => Promise<void>;
  isResumePromptOpen: boolean;
  resumeCandidateSessionId: string | null;
  isResumeCandidateGuest: boolean;
  isResumeResolving: boolean;
  handleContinueResumeCandidate: () => Promise<void>;
  handleDismissResumeCandidate: () => void;
};
