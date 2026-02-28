"use client";

import { SetupView } from "@/features/interview-setup/ui/SetupView";
import { RoomView } from "@/widgets/interview-room/ui/RoomView";
import { ReportView } from "@/features/interview-report/ui/ReportView";
import { InsightsView } from "@/features/interview-insights/ui/InsightsView";
import { LoginRequiredModal } from "@/features/auth/ui/LoginRequiredModal";
import { ResumeSessionModal } from "@/features/interview-session/ui/ResumeSessionModal";
import { Button } from "@/shared/ui/Button";
import { InlineNotice } from "@/shared/ui/InlineNotice";
import { useInterviewShellState } from "@/widgets/interview/model/useInterviewShellState";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";
import { getAuthRequiredMessage } from "@/shared/auth/session";
import { BrandIdentityLink } from "@/shared/ui/BrandIdentityLink";

type InterviewShellProps = {
  initialStep?: InterviewStep;
  initialSessionId?: string | null;
};

export function InterviewShell({ initialStep, initialSessionId }: InterviewShellProps) {
  const shellState = useInterviewShellState({
    initialStep,
    initialSessionId
  });
  const isNavigationBusy =
    shellState.isStarting ||
    shellState.isReportLoading ||
    shellState.isInsightsLoading ||
    shellState.isRetryingWeakness ||
    shellState.isExiting ||
    shellState.isSubmitting ||
    shellState.isAuthLoading ||
    shellState.isResumeResolving;

  if (shellState.step === "room" && shellState.sessionId) {
    return (
      <RoomView
        character={shellState.character}
        avatarState={shellState.avatarState}
        avatarCueToken={shellState.avatarCueToken}
        emotion={shellState.emotion}
        audioRef={shellState.ttsAudioRef}
        isAutoplayBlocked={shellState.isAutoplayBlocked}
        playTtsAudio={shellState.playTtsAudio}
        isRecording={shellState.isRecording}
        isSttBusy={shellState.isSttBusy}
        onToggleRecording={shellState.handleToggleRecording}
        reactionEnabled={shellState.reactionEnabled}
        jobRoleLabel={shellState.jobRoleLabel}
        stackLabel={shellState.stackLabel}
        difficultyLabel={shellState.difficultyLabel}
        questionOrder={shellState.questionOrder}
        totalQuestions={shellState.totalQuestions}
        followupCount={shellState.followupCount}
        streamingQuestionText={shellState.streamingQuestionText}
        isQuestionStreaming={shellState.isQuestionStreaming}
        isResumeResolving={shellState.isResumeResolving}
        messages={shellState.messages}
        answerText={shellState.answerText}
        onChangeAnswer={shellState.setAnswerText}
        isSubmitting={shellState.isSubmitting}
        onSubmitAnswer={shellState.handleSubmitAnswer}
        isExiting={shellState.isExiting}
        onExit={shellState.handleExit}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-white">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-im-border bg-white">
        <div className="mx-auto flex h-[60px] w-full max-w-6xl items-center gap-3 px-6">
          <BrandIdentityLink />

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Button
              variant={shellState.step === "setup" ? "primary" : "ghost"}
              onClick={() => shellState.setStep("setup")}
              disabled={isNavigationBusy}
              className="rounded-full px-6 py-2.5 text-base font-bold transition-transform"
            >
              면접
            </Button>
            <Button
              variant={shellState.step === "report" ? "primary" : "ghost"}
              onClick={() => shellState.setStep("report")}
              disabled={isNavigationBusy}
              className="rounded-full px-6 py-2.5 text-base font-bold transition-transform"
            >
              리포트
            </Button>
            <Button
              variant={shellState.step === "insights" ? "primary" : "ghost"}
              onClick={() => void shellState.handleGoInsights()}
              disabled={isNavigationBusy}
              className="rounded-full px-6 py-2.5 text-base font-bold transition-transform"
            >
              학습
            </Button>

            <div className="ml-2 mr-1 h-6 w-px bg-im-border/80" /> {/* Divider */}

            {shellState.isMemberAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void shellState.handleGoogleLogout()}
                disabled={isNavigationBusy}
                className="rounded-full text-im-text-muted hover:bg-red-50 hover:text-red-500"
              >
                로그아웃
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void shellState.handleGoogleLogin()}
                disabled={isNavigationBusy}
                className="rounded-full shadow-sm"
              >
                로그인
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 sm:py-8">
        {shellState.backendStatus === "error" ? (
          <InlineNotice
            variant="warning"
            className="mb-4"
            message={shellState.backendStatusMessage ?? "백엔드 연결 확인에 실패했습니다."}
            actions={
              <Button
                variant="secondary"
                onClick={() => void shellState.retryBackendHealthCheck()}
                className="shrink-0"
                disabled={isNavigationBusy}
              >
                다시 시도
              </Button>
            }
          />
        ) : null}

        {shellState.step === "setup" ? (
          <SetupView
            value={shellState.setupPayload}
            onChange={shellState.setSetupPayload}
            onStart={shellState.handleStartInterview}
            isStarting={shellState.isStarting}
            canStart={!shellState.isAuthRequired}
          />
        ) : null}

        {shellState.step === "report" ? (
          <ReportView
            report={shellState.report}
            isLoading={shellState.isReportLoading}
            errorMessage={shellState.reportErrorMessage}
            errorCode={shellState.reportErrorCode}
            isGoingInsights={shellState.isInsightsLoading}
            isBusy={isNavigationBusy}
            onRetry={shellState.handleRetryReport}
            onGoInsights={shellState.handleGoInsights}
            onRestart={() => shellState.setStep("setup")}
            onLogin={() => void shellState.handleGoogleLogin(shellState.authRedirectTarget)}
          />
        ) : null}

        {shellState.step === "insights" ? (
          <InsightsView
            sessions={shellState.sessions}
            weakKeywords={shellState.weakKeywords}
            studyGuide={shellState.studyGuide}
            isLoading={shellState.isInsightsLoading}
            errorMessage={shellState.insightsErrorMessage}
            isRetryingWeakness={shellState.isRetryingWeakness}
            onRefresh={() => void shellState.handleGoInsights()}
            onRetryWeakness={shellState.handleRetryWeakness}
          />
        ) : null}
      </div>

      {shellState.isAuthRequired ? (
        <LoginRequiredModal
          message={shellState.uiError ?? getAuthRequiredMessage()}
          onClose={shellState.clearUiError}
          isLoading={shellState.isAuthLoading}
          onLogin={() => shellState.handleGoogleLogin(shellState.authRedirectTarget)}
        />
      ) : null}

      {shellState.isResumePromptOpen && shellState.resumeCandidateSessionId ? (
        <ResumeSessionModal
          sessionId={shellState.resumeCandidateSessionId}
          isGuest={shellState.isResumeCandidateGuest}
          isLoading={shellState.isResumeResolving || shellState.isAuthLoading}
          onContinue={() => void shellState.handleContinueResumeCandidate()}
          onStartNew={shellState.handleDismissResumeCandidate}
        />
      ) : null}
    </div>
  );
}
