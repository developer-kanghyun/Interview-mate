import {
  fetchLandingGoogleAuthUrlGateway,
  fetchLandingProfileGateway,
  type AuthMeApiResponse,
  type GoogleAuthUrlApiResponse
} from "@/features/landing/model/infrastructure/landingAuthGateway";

export type { AuthMeApiResponse, GoogleAuthUrlApiResponse };

export function fetchLandingGoogleAuthUrlUseCase(): Promise<GoogleAuthUrlApiResponse> {
  return fetchLandingGoogleAuthUrlGateway();
}

export function fetchLandingProfileUseCase(): Promise<AuthMeApiResponse> {
  return fetchLandingProfileGateway();
}
