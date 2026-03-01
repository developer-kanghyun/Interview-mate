import type { RefObject } from "react";
import {
  interviewerNameMap,
  mapDifficultyLabel,
  mapRoleLabel,
  type InterviewStep
} from "@/features/interview-session/model/interviewSession.constants";
import type {
  InterviewEmotion,
  InterviewReport,
  ReportQuestionGuide,
  SessionHistoryItem,
  StartInterviewPayload
} from "@/features/interview-session/model/application/interviewSessionUseCases";
import type { ChatMessage } from "@/shared/chat/ChatBoard";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";
import type { UseInterviewShellStateResult } from "@/features/interview-session/model/interviewShell.types";

export type BuildInterviewShellStateArgs = {
  step: InterviewStep;
  updateStep: (next: InterviewStep) => void;
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
  runBackendHealthCheck: () => Promise<void>;
  setupPayload: StartInterviewPayload;
  setSetupPayload: (next: StartInterviewPayload) => void;
  isStarting: boolean;
  sessionId: string | null;
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
  questionOrder: number;
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

export function buildInterviewShellState(args: BuildInterviewShellStateArgs): UseInterviewShellStateResult {
  return {
    step: args.step,
    setStep: args.updateStep,
    uiError: args.uiError,
    clearUiError: args.clearUiError,
    handleRetryUiError: args.handleRetryUiError,
    authStatus: args.authStatus,
    isMemberAuthenticated: args.isMemberAuthenticated,
    isAuthRequired: args.isAuthRequired,
    reportErrorCode: args.reportErrorCode,
    authRedirectTarget: args.authRedirectTarget,
    handleGoogleLogin: args.handleGoogleLogin,
    handleGoogleLogout: args.handleGoogleLogout,
    isAuthLoading: args.isAuthLoading,
    backendStatus: args.backendStatus,
    backendStatusMessage: args.backendStatusMessage,
    retryBackendHealthCheck: args.runBackendHealthCheck,
    setupPayload: args.setupPayload,
    setSetupPayload: args.setSetupPayload,
    isStarting: args.isStarting,
    sessionId: args.sessionId,
    interviewerName: interviewerNameMap[args.setupPayload.character],
    character: args.setupPayload.character,
    avatarState: args.avatarState,
    avatarCueToken: args.avatarCueToken,
    emotion: args.emotion,
    ttsAudioRef: args.ttsAudioRef,
    isAutoplayBlocked: args.isAutoplayBlocked,
    playTtsAudio: args.playTtsAudio,
    isRecording: args.isRecording,
    isSttSupported: args.isSttSupported,
    isSttBusy: args.isSttBusy,
    handleToggleRecording: args.handleToggleRecording,
    reactionEnabled: args.setupPayload.reactionEnabled,
    jobRoleLabel: mapRoleLabel(args.setupPayload.jobRole),
    stackLabel: args.setupPayload.stack,
    difficultyLabel: mapDifficultyLabel(args.setupPayload.difficulty),
    questionOrder: args.questionOrder,
    totalQuestions: args.setupPayload.questionCount,
    followupCount: args.followupCount,
    streamingQuestionText: args.streamingQuestionText,
    isQuestionStreaming: args.isQuestionStreaming,
    messages: args.messages,
    answerText: args.answerText,
    setAnswerText: args.setAnswerText,
    isSubmitting: args.isSubmitting,
    handleStartInterview: args.handleStartInterview,
    handleSubmitAnswer: args.handleSubmitAnswer,
    handlePause: args.handlePause,
    handleExit: args.handleExit,
    isExiting: args.isExiting,
    report: args.report,
    isReportLoading: args.isReportLoading,
    reportErrorMessage: args.reportErrorMessage,
    handleRetryReport: args.handleRetryReport,
    handleGoInsights: args.handleGoInsights,
    isInsightsLoading: args.isInsightsLoading,
    insightsErrorMessage: args.insightsErrorMessage,
    sessions: args.sessions,
    weakKeywords: args.weakKeywords,
    studyGuide: args.studyGuide,
    questionGuides: args.questionGuides,
    isRetryingWeakness: args.isRetryingWeakness,
    handleRetryWeakness: args.handleRetryWeakness,
    resumeCandidateSessionId: args.resumeCandidateSessionId,
    isResumePromptOpen: args.isResumePromptOpen,
    isResumeCandidateGuest: args.isResumeCandidateGuest,
    isResumeResolving: args.isResumeResolving,
    handleContinueResumeCandidate: args.handleContinueResumeCandidate,
    handleDismissResumeCandidate: args.handleDismissResumeCandidate
  };
}
