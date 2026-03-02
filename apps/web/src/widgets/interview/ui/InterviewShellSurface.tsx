"use client";

import { LoginRequiredModal } from "@/features/auth/ui/LoginRequiredModal";
import { ResumeSessionModal } from "@/features/interview-session/ui/ResumeSessionModal";
import { getAuthRequiredMessage } from "@/shared/auth/session";
import { InterviewShellHeader } from "@/widgets/interview/ui/InterviewShellHeader";
import { InterviewShellStepContent } from "@/widgets/interview/ui/InterviewShellStepContent";
import { useInterviewShellSurfaceState } from "@/features/interview-session/model/application/useInterviewShellSurfaceState";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

type InterviewShellSurfaceProps = {
  initialStep?: InterviewStep;
  initialSessionId?: string | null;
};

export function InterviewShellSurface({ initialStep, initialSessionId }: InterviewShellSurfaceProps) {
  const shellState = useInterviewShellSurfaceState({
    initialStep,
    initialSessionId
  });

  return (
    <div className="min-h-dvh bg-white">
      <InterviewShellHeader shellState={shellState} isNavigationBusy={shellState.isNavigationBusy} />
      <InterviewShellStepContent shellState={shellState} isNavigationBusy={shellState.isNavigationBusy} />

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
