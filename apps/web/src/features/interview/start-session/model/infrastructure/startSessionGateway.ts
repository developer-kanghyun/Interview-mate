import {
  startInterview,
  type StartInterviewPayload,
  type StartInterviewResponse
} from "@/shared/api/interview-client";

export type { StartInterviewPayload, StartInterviewResponse };

export function startSessionGateway(payload: StartInterviewPayload): Promise<StartInterviewResponse> {
  return startInterview(payload);
}
