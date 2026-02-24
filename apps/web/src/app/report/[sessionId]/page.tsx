import { InterviewShell } from "@/widgets/interview/ui/InterviewShell";

type ReportPageProps = {
  params: {
    sessionId: string;
  };
};

export default function ReportPage({ params }: ReportPageProps) {
  return <InterviewShell initialStep="report" initialSessionId={decodeURIComponent(params.sessionId)} />;
}
