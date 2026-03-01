import {
  fetchInterviewReportGateway,
  type InterviewReport
} from "@/features/interview-report/model/infrastructure/interviewReportGateway";

export type { InterviewReport };

export function fetchInterviewReportUseCase(sessionId: string): Promise<InterviewReport> {
  return fetchInterviewReportGateway(sessionId);
}
