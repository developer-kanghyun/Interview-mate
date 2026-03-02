"use client";

import dynamic from "next/dynamic";
import { LoginRequiredModal } from "@/features/auth/ui/LoginRequiredModal";
import { ResumeSessionModal } from "@/features/interview-session/ui/ResumeSessionModal";
import { useInterviewShellState } from "@/features/interview-session/model/application/useInterviewShellState";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";
import { getAuthRequiredMessage } from "@/shared/auth/session";
import { InterviewShellHeader } from "@/widgets/interview/ui/InterviewShellHeader";
import { InterviewShellStepContent } from "@/widgets/interview/ui/InterviewShellStepContent";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";

const RoomViewSection = dynamic(
  () => import("@/widgets/interview-room/ui/RoomView").then((module) => module.RoomView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh min-h-dvh items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-im-text-muted">
          <LoadingSpinner size="lg" tone="primary" label="면접 화면을 준비 중입니다." />
          <p className="text-sm font-semibold">면접 화면을 준비하고 있어요...</p>
        </div>
      </div>
    )
  }
);

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
      <RoomViewSection
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
      <InterviewShellHeader shellState={shellState} isNavigationBusy={isNavigationBusy} />
      <InterviewShellStepContent shellState={shellState} isNavigationBusy={isNavigationBusy} />

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
