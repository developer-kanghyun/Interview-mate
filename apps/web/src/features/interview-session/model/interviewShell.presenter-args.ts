import type { StartInterviewPayload } from "@/shared/api/interview-client";
import type { UseInterviewRoomFlowResult } from "@/features/interview-session/model/interviewRoom.types";
import type { BuildInterviewShellStateArgs } from "@/features/interview-session/model/interviewShell.presenter";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

type ReportFlowShape = {
  reportErrorCode: "auth_required" | "unknown" | null;
  report: BuildInterviewShellStateArgs["report"];
  isReportLoading: boolean;
  reportErrorMessage: string | null;
  handleRetryReport: () => Promise<void>;
  handleGoInsights: () => Promise<void>;
  isInsightsLoading: boolean;
  insightsErrorMessage: string | null;
  sessions: BuildInterviewShellStateArgs["sessions"];
  weakKeywords: string[];
  studyGuide: string[];
  questionGuides: BuildInterviewShellStateArgs["questionGuides"];
  isRetryingWeakness: boolean;
  handleRetryWeakness: () => Promise<void>;
};

type BuildInterviewShellPresenterArgsOptions = {
  step: InterviewStep;
  updateStep: (next: InterviewStep) => void;
  uiError: string | null;
  clearUiError: () => void;
  handleRetryUiError: () => Promise<void>;
  authStatus: BuildInterviewShellStateArgs["authStatus"];
  isMemberAuthenticatedBase: boolean;
  isAuthRequired: boolean;
  authRedirectTarget: string;
  handleGoogleLogin: (redirectTo?: string) => Promise<void>;
  handleGoogleLogout: () => Promise<void>;
  isAuthLoading: boolean;
  backendStatus: BuildInterviewShellStateArgs["backendStatus"];
  backendStatusMessage: string | null;
  runBackendHealthCheck: () => Promise<void>;
  setupPayload: StartInterviewPayload;
  setSetupPayload: (next: StartInterviewPayload) => void;
  isStarting: boolean;
  sessionId: string | null;
  roomFlow: UseInterviewRoomFlowResult;
  reportFlow: ReportFlowShape;
  handleStartInterview: () => Promise<void>;
  handleExit: () => Promise<void>;
  isExiting: boolean;
  resumeCandidateSessionId: string | null;
  isResumePromptOpen: boolean;
  isResumeCandidateGuest: boolean;
  isResumeResolving: boolean;
  handleContinueResumeCandidate: () => Promise<void>;
  handleDismissResumeCandidate: () => void;
};

export function buildInterviewShellPresenterArgs(
  options: BuildInterviewShellPresenterArgsOptions
): BuildInterviewShellStateArgs {
  return {
    step: options.step,
    updateStep: options.updateStep,
    uiError: options.uiError,
    clearUiError: options.clearUiError,
    handleRetryUiError: options.handleRetryUiError,
    authStatus: options.authStatus,
    isMemberAuthenticated:
      options.isMemberAuthenticatedBase && options.reportFlow.reportErrorCode !== "auth_required",
    isAuthRequired: options.isAuthRequired,
    reportErrorCode: options.reportFlow.reportErrorCode,
    authRedirectTarget: options.authRedirectTarget,
    handleGoogleLogin: options.handleGoogleLogin,
    handleGoogleLogout: options.handleGoogleLogout,
    isAuthLoading: options.isAuthLoading,
    backendStatus: options.backendStatus,
    backendStatusMessage: options.backendStatusMessage,
    runBackendHealthCheck: options.runBackendHealthCheck,
    setupPayload: options.setupPayload,
    setSetupPayload: options.setSetupPayload,
    isStarting: options.isStarting,
    sessionId: options.sessionId,
    avatarState: options.roomFlow.avatarState,
    avatarCueToken: options.roomFlow.avatarCueToken,
    emotion: options.roomFlow.emotion,
    ttsAudioRef: options.roomFlow.ttsAudioRef,
    isAutoplayBlocked: options.roomFlow.isAutoplayBlocked,
    playTtsAudio: options.roomFlow.playTtsAudio,
    isRecording: options.roomFlow.isRecording,
    isSttSupported: options.roomFlow.isSttSupported,
    isSttBusy: options.roomFlow.isSttBusy,
    handleToggleRecording: options.roomFlow.handleToggleRecording,
    questionOrder: options.roomFlow.questionOrder,
    followupCount: options.roomFlow.followupCount,
    streamingQuestionText: options.roomFlow.streamingQuestionText,
    isQuestionStreaming: options.roomFlow.isQuestionStreaming,
    messages: options.roomFlow.messages,
    answerText: options.roomFlow.answerText,
    setAnswerText: options.roomFlow.setAnswerText,
    isSubmitting: options.roomFlow.isSubmitting,
    handleStartInterview: options.handleStartInterview,
    handleSubmitAnswer: options.roomFlow.handleSubmitAnswer,
    handlePause: options.roomFlow.handlePause,
    handleExit: options.handleExit,
    isExiting: options.isExiting,
    report: options.reportFlow.report,
    isReportLoading: options.reportFlow.isReportLoading,
    reportErrorMessage: options.reportFlow.reportErrorMessage,
    handleRetryReport: options.reportFlow.handleRetryReport,
    handleGoInsights: options.reportFlow.handleGoInsights,
    isInsightsLoading: options.reportFlow.isInsightsLoading,
    insightsErrorMessage: options.reportFlow.insightsErrorMessage,
    sessions: options.reportFlow.sessions,
    weakKeywords: options.reportFlow.weakKeywords,
    studyGuide: options.reportFlow.studyGuide,
    questionGuides: options.reportFlow.questionGuides,
    isRetryingWeakness: options.reportFlow.isRetryingWeakness,
    handleRetryWeakness: options.reportFlow.handleRetryWeakness,
    resumeCandidateSessionId: options.resumeCandidateSessionId,
    isResumePromptOpen: options.isResumePromptOpen,
    isResumeCandidateGuest: options.isResumeCandidateGuest,
    isResumeResolving: options.isResumeResolving,
    handleContinueResumeCandidate: options.handleContinueResumeCandidate,
    handleDismissResumeCandidate: options.handleDismissResumeCandidate
  };
}
