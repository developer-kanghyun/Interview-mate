"use client";

import { SetupView } from "@/features/interview-setup/ui/SetupView";
import { RoomView } from "@/widgets/interview-room/ui/RoomView";
import { ReportView } from "@/features/interview-report/ui/ReportView";
import { InsightsView } from "@/features/interview-insights/ui/InsightsView";
import { Button } from "@/shared/ui/Button";
import { useInterviewFlow } from "@/widgets/interview/model/useInterviewFlow";

export function InterviewShell() {
  const flow = useInterviewFlow();

  if (flow.step === "room" && flow.sessionId) {
    return (
      <RoomView
        interviewerName={flow.interviewerName}
        sessionId={flow.sessionId}
        character={flow.character}
        avatarState={flow.avatarState}
        emotion={flow.emotion}
        audioRef={flow.ttsAudioRef}
        reactionEnabled={flow.reactionEnabled}
        jobRoleLabel={flow.jobRoleLabel}
        stackLabel={flow.stackLabel}
        difficultyLabel={flow.difficultyLabel}
        questionOrder={flow.questionOrder}
        totalQuestions={flow.totalQuestions}
        followupCount={flow.followupCount}
        streamingQuestionText={flow.streamingQuestionText}
        isQuestionStreaming={flow.isQuestionStreaming}
        messages={flow.messages}
        answerText={flow.answerText}
        onChangeAnswer={flow.setAnswerText}
        onSubmitAnswer={flow.handleSubmitAnswer}
        onPause={flow.handlePause}
        onExit={flow.handleExit}
      />
    );
  }

  return (
    <div className="min-h-dvh">
      <div className="border-b border-white/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-3 md:px-6">
          <span className="mr-2 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
            INTERVIEW FLOW
          </span>
          <Button variant={flow.step === "setup" ? "primary" : "secondary"} onClick={() => flow.setStep("setup")}>
            Setup
          </Button>
          <Button variant={flow.step === "report" ? "primary" : "secondary"} onClick={() => flow.setStep("report")}>
            Report
          </Button>
          <Button variant={flow.step === "insights" ? "primary" : "secondary"} onClick={() => flow.setStep("insights")}>
            Insights
          </Button>
        </div>
      </div>

      <div className="px-2 py-4 sm:px-4 sm:py-6">
        {flow.backendStatus === "error" ? (
          <div className="mx-auto mb-4 flex w-full max-w-5xl items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>{flow.backendStatusMessage ?? "백엔드 연결 확인에 실패했습니다."}</span>
            <Button variant="secondary" onClick={() => void flow.retryBackendHealthCheck()} className="shrink-0">
              다시 시도
            </Button>
          </div>
        ) : null}

        {flow.uiError ? (
          <div className="mx-auto mb-4 w-full max-w-5xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {flow.uiError}
          </div>
        ) : null}

        {flow.step === "setup" ? (
          <SetupView
            value={flow.setupPayload}
            onChange={flow.setSetupPayload}
            onStart={flow.handleStartInterview}
            isStarting={flow.isStarting}
          />
        ) : null}

        {flow.step === "report" ? (
          <ReportView report={flow.report} onGoInsights={flow.handleGoInsights} onRestart={() => flow.setStep("setup")} />
        ) : null}

        {flow.step === "insights" ? (
          <InsightsView
            sessions={flow.sessions}
            weakKeywords={flow.weakKeywords}
            studyGuide={flow.studyGuide}
            periodDays={flow.periodDays}
            onChangePeriod={flow.handleChangePeriod}
            onRetryWeakness={flow.handleRetryWeakness}
            onBackSetup={() => flow.setStep("setup")}
          />
        ) : null}
      </div>
    </div>
  );
}
