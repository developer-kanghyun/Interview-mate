"use client";

import { SetupView } from "@/features/interview-setup/ui/SetupView";
import { ReportView } from "@/features/interview-report/ui/ReportView";
import { InsightsView } from "@/features/interview-insights/ui/InsightsView";
import { Button } from "@/shared/ui/Button";
import { InlineNotice } from "@/shared/ui/InlineNotice";
import type { UseInterviewShellStateResult } from "@/features/interview-session/model/application/useInterviewShellState";

type InterviewShellStepContentProps = {
  shellState: UseInterviewShellStateResult;
  isNavigationBusy: boolean;
};

export function InterviewShellStepContent({ shellState, isNavigationBusy }: InterviewShellStepContentProps) {
  return (
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
          canStart={shellState.authStatus !== "loading" && !shellState.isAuthRequired}
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
          questionGuides={shellState.questionGuides}
          isLoading={shellState.isInsightsLoading}
          errorMessage={shellState.insightsErrorMessage}
          isRetryingWeakness={shellState.isRetryingWeakness}
          onRefresh={() => void shellState.handleGoInsights()}
          onRetryWeakness={shellState.handleRetryWeakness}
        />
      ) : null}
    </div>
  );
}
