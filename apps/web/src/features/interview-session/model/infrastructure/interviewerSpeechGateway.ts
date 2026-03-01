export type RequestInterviewerSpeechInput = {
  text: string;
  character?: string;
  signal: AbortSignal;
};

export function requestInterviewerSpeechGateway({
  text,
  character = "zet",
  signal
}: RequestInterviewerSpeechInput): Promise<Response> {
  return fetch("/api/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      character
    }),
    signal
  });
}
