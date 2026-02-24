"use client";

import { SetupView } from "@/features/interview-setup/ui/SetupView";
import { RoomView } from "@/widgets/interview-room/ui/RoomView";
import { ReportView } from "@/features/interview-report/ui/ReportView";
import { InsightsView } from "@/features/interview-insights/ui/InsightsView";
import { LoginRequiredModal } from "@/features/auth/ui/LoginRequiredModal";
import { Button } from "@/shared/ui/Button";
import { InlineNotice } from "@/shared/ui/InlineNotice";
import { useInterviewShellState } from "@/widgets/interview/model/useInterviewShellState";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

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
    shellState.isAuthLoading;

  if (shellState.step === "room" && shellState.sessionId) {
    return (
      <RoomView
        interviewerName={shellState.interviewerName}
        sessionId={shellState.sessionId}
        character={shellState.character}
        avatarState={shellState.avatarState}
        emotion={shellState.emotion}
        audioRef={shellState.ttsAudioRef}
        isAutoplayBlocked={shellState.isAutoplayBlocked}
        playTtsAudio={shellState.playTtsAudio}
        ttsNotice={shellState.ttsNotice}
        onDismissTtsNotice={shellState.clearTtsNotice}
        isRecording={shellState.isRecording}
        isSttSupported={shellState.isSttSupported}
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
        messages={shellState.messages}
        answerText={shellState.answerText}
        onChangeAnswer={shellState.setAnswerText}
        isSubmitting={shellState.isSubmitting}
        onSubmitAnswer={shellState.handleSubmitAnswer}
        onPause={shellState.handlePause}
        isExiting={shellState.isExiting}
        onExit={shellState.handleExit}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-white">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-im-border bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-6 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-im-primary text-xs font-extrabold text-white">
            IM
          </div>
          <span className="text-sm font-bold tracking-tight text-im-text-main">
            Interview Mate
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant={shellState.step === "setup" ? "primary" : "ghost"}
              onClick={() => shellState.setStep("setup")}
              disabled={isNavigationBusy}
              className="rounded-full px-4 py-1.5 text-xs"
            >
              Setup
            </Button>
            <Button
              variant={shellState.step === "report" ? "primary" : "ghost"}
              onClick={() => shellState.setStep("report")}
              disabled={isNavigationBusy}
              className="rounded-full px-4 py-1.5 text-xs"
            >
              Report
            </Button>
            <Button
              variant={shellState.step === "insights" ? "primary" : "ghost"}
              onClick={() => void shellState.handleGoInsights()}
              disabled={isNavigationBusy}
              className="rounded-full px-4 py-1.5 text-xs"
            >
              Insights
            </Button>
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

        {shellState.uiError && !shellState.isAuthRequired ? (
          <InlineNotice
            variant="error"
            className="mb-4"
            message={shellState.uiError}
            actions={
              <>
                <Button variant="secondary" onClick={() => void shellState.handleRetryUiError()} disabled={isNavigationBusy}>
                  다시 시도
                </Button>
                <Button variant="secondary" onClick={shellState.clearUiError} disabled={isNavigationBusy}>
                  닫기
                </Button>
              </>
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
            onBackSetup={() => shellState.setStep("setup")}
          />
        ) : null}
      </div>

      {shellState.uiError && shellState.isAuthRequired ? (
        <LoginRequiredModal
          message={shellState.uiError}
          onClose={shellState.clearUiError}
          isLoading={shellState.isAuthLoading}
          onLogin={() => shellState.handleGoogleLogin(shellState.authRedirectTarget)}
        />
      ) : null}
    </div>
  );
}
