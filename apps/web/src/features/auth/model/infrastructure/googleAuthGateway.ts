import {
  completeGoogleAuth,
  type GoogleAuthCallbackApiResponse
} from "@/shared/api/interview";

export type { GoogleAuthCallbackApiResponse };

export function completeGoogleAuthGateway(
  code: string,
  state?: string | null
): Promise<GoogleAuthCallbackApiResponse> {
  return completeGoogleAuth(code, state);
}
