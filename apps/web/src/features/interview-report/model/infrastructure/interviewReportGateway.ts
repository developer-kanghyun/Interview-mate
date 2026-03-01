import {
  getReport,
  type InterviewReport
} from "@/shared/api/interview-client";

export type { InterviewReport };

export function fetchInterviewReportGateway(sessionId: string): Promise<InterviewReport> {
  return getReport(sessionId);
}
