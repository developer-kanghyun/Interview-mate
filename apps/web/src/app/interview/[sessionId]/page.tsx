import { InterviewShell } from "@/widgets/interview/ui/InterviewShell";

type InterviewSessionPageProps = {
  params: {
    sessionId: string;
  };
};

export default function InterviewSessionPage({ params }: InterviewSessionPageProps) {
  return <InterviewShell initialStep="room" initialSessionId={decodeURIComponent(params.sessionId)} />;
}
