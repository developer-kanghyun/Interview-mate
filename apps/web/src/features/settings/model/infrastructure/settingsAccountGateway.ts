import {
  getMyProfile,
  type AuthMeApiResponse
} from "@/shared/api/interview";

export type { AuthMeApiResponse };

export function fetchSettingsAccountGateway(): Promise<AuthMeApiResponse> {
  return getMyProfile();
}
