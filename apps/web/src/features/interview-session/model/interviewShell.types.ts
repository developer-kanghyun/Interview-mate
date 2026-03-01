import type { RefObject } from "react";
import type {
  InterviewCharacter,
  InterviewEmotion,
  InterviewReport,
  ReportQuestionGuide,
  SessionHistoryItem,
  StartInterviewPayload
} from "@/shared/api/interview-client";
import type { ChatMessage } from "@/shared/chat/ChatBoard";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";

export type UseInterviewShellStateResult = {
  step: InterviewStep;
  setStep: (next: InterviewStep) => void;
  uiError: string | null;
  clearUiError: () => void;
  handleRetryUiError: () => Promise<void>;
  authStatus: "loading" | "member" | "guest" | "anonymous" | "error";
  isMemberAuthenticated: boolean;
  isAuthRequired: boolean;
  reportErrorCode: "auth_required" | "unknown" | null;
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
  sessionId: string | null;
  interviewerName: string;
  character: InterviewCharacter;
  avatarState: AvatarState;
  avatarCueToken: number;
  emotion: InterviewEmotion;
  ttsAudioRef: RefObject<HTMLAudioElement>;
  isAutoplayBlocked: boolean;
  playTtsAudio: () => void;
  isRecording: boolean;
  isSttSupported: boolean;
  isSttBusy: boolean;
  handleToggleRecording: () => void;
  reactionEnabled: boolean;
  jobRoleLabel: string;
  stackLabel: string;
  difficultyLabel: string;
  questionOrder: number;
  totalQuestions: number;
  followupCount: number;
  streamingQuestionText: string;
  isQuestionStreaming: boolean;
  messages: ChatMessage[];
  answerText: string;
  setAnswerText: (value: string) => void;
  isSubmitting: boolean;
  handleStartInterview: () => Promise<void>;
  handleSubmitAnswer: () => Promise<void>;
  handlePause: () => void;
  handleExit: () => Promise<void>;
  isExiting: boolean;
  report: InterviewReport | null;
  isReportLoading: boolean;
  reportErrorMessage: string | null;
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
  resumeCandidateSessionId: string | null;
  isResumePromptOpen: boolean;
  isResumeCandidateGuest: boolean;
  isResumeResolving: boolean;
  handleContinueResumeCandidate: () => Promise<void>;
  handleDismissResumeCandidate: () => void;
};

export type UseInterviewShellStateOptions = {
  initialStep?: InterviewStep;
  initialSessionId?: string | null;
};
