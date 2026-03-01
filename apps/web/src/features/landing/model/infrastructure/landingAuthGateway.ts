import {
  getGoogleAuthUrl,
  getMyProfile,
  type AuthMeApiResponse,
  type GoogleAuthUrlApiResponse
} from "@/shared/api/interview";

export type { AuthMeApiResponse, GoogleAuthUrlApiResponse };

export function fetchLandingGoogleAuthUrlGateway(): Promise<GoogleAuthUrlApiResponse> {
  return getGoogleAuthUrl();
}

export function fetchLandingProfileGateway(): Promise<AuthMeApiResponse> {
  return getMyProfile();
}
