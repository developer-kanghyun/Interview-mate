"use client";

import dynamic from "next/dynamic";
import { SetupView } from "@/features/interview-setup/ui/SetupView";
import { Button } from "@/shared/ui/Button";
import { InlineNotice } from "@/shared/ui/InlineNotice";
import type { InterviewShellViewState } from "@/widgets/interview/ui/interviewShellView.types";

const ReportViewSection = dynamic(
  () => import("@/features/interview-report/ui/ReportView").then((module) => module.ReportView),
  {
    ssr: false
  }
);

const InsightsViewSection = dynamic(
  () => import("@/features/interview-insights/ui/InsightsView").then((module) => module.InsightsView),
  {
    ssr: false
  }
);

type InterviewShellStepContentProps = {
  shellState: InterviewShellViewState;
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
          isStarting={shellState.isStarting || shellState.isAuthLoading}
          canStart={!shellState.isAuthRequired}
        />
      ) : null}

      {shellState.step === "report" ? (
        <ReportViewSection
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
        <InsightsViewSection
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
