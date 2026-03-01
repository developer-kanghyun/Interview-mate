import {
  startSessionGateway,
  type StartInterviewPayload,
  type StartInterviewResponse
} from "@/features/interview/start-session/model/infrastructure/startSessionGateway";

export type { StartInterviewPayload, StartInterviewResponse };

export function startInterviewSessionUseCase(
  payload: StartInterviewPayload
): Promise<StartInterviewResponse> {
  return startSessionGateway(payload);
}
