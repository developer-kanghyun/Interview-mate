import { InterviewShell } from "@/widgets/interview/ui/InterviewShell";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

type InterviewPageProps = {
  searchParams?: {
    step?: string;
    sessionId?: string;
  };
};

function normalizeStep(step: string | undefined): InterviewStep | undefined {
  if (step === "setup" || step === "room" || step === "report" || step === "insights") {
    return step;
  }
  return undefined;
}

function normalizeSessionId(sessionId: string | undefined) {
  if (!sessionId) {
    return undefined;
  }
  const trimmed = sessionId.trim();
  return trimmed ? trimmed : undefined;
}

export default function InterviewPage({ searchParams }: InterviewPageProps) {
  const initialStep = normalizeStep(searchParams?.step);
  const initialSessionId = normalizeSessionId(searchParams?.sessionId);
  return <InterviewShell initialStep={initialStep} initialSessionId={initialSessionId} />;
}
