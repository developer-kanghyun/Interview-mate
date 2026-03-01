import {
  completeGoogleAuthGateway,
  type GoogleAuthCallbackApiResponse
} from "@/features/auth/model/infrastructure/googleAuthGateway";

export type { GoogleAuthCallbackApiResponse };

export function completeGoogleAuthUseCase(
  code: string,
  state?: string | null
): Promise<GoogleAuthCallbackApiResponse> {
  return completeGoogleAuthGateway(code, state);
}
