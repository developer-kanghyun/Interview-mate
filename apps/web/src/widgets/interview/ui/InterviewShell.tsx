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
    shellState.isSubmitting;

  if (shellState.step === "room" && shellState.sessionId) {
    return (
      <RoomView
        interviewerName={shellState.interviewerName}
        sessionId={shellState.sessionId}
        character={shellState.character}
        avatarState={shellState.avatarState}
        emotion={shellState.emotion}
        audioRef={shellState.ttsAudioRef}
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
    <div className="min-h-dvh">
      <div className="border-b border-white/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-3 md:px-6">
          <span className="mr-2 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
            INTERVIEW SESSION
          </span>
          <Button
            variant={shellState.step === "setup" ? "primary" : "secondary"}
            onClick={() => shellState.setStep("setup")}
            disabled={isNavigationBusy}
          >
            Setup
          </Button>
          <Button
            variant={shellState.step === "report" ? "primary" : "secondary"}
            onClick={() => shellState.setStep("report")}
            disabled={isNavigationBusy}
          >
            Report
          </Button>
          <Button
            variant={shellState.step === "insights" ? "primary" : "secondary"}
            onClick={() => void shellState.handleGoInsights()}
            disabled={isNavigationBusy}
          >
            Insights
          </Button>
        </div>
      </div>

      <div className="px-2 py-4 sm:px-4 sm:py-6">
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
          onLogin={() => shellState.handleGoogleLogin(shellState.authRedirectTarget)}
        />
      ) : null}
    </div>
  );
}
