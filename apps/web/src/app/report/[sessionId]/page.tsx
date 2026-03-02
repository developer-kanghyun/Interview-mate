import { InterviewShellSurface } from "@/widgets/interview/ui/InterviewShellSurface";

type ReportPageProps = {
  params: {
    sessionId: string;
  };
};

export default function ReportPage({ params }: ReportPageProps) {
  return <InterviewShellSurface initialStep="report" initialSessionId={decodeURIComponent(params.sessionId)} />;
}
