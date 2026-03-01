import {
  requestInterviewerSpeechGateway,
  type RequestInterviewerSpeechInput
} from "@/features/interview-session/model/infrastructure/interviewerSpeechGateway";

export type { RequestInterviewerSpeechInput };

export function requestInterviewerSpeechUseCase(
  input: RequestInterviewerSpeechInput
): Promise<Response> {
  return requestInterviewerSpeechGateway(input);
}
