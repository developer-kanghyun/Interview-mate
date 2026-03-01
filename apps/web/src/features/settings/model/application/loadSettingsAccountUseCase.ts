import {
  fetchSettingsAccountGateway,
  type AuthMeApiResponse
} from "@/features/settings/model/infrastructure/settingsAccountGateway";

export type { AuthMeApiResponse };

export function loadSettingsAccountUseCase(): Promise<AuthMeApiResponse> {
  return fetchSettingsAccountGateway();
}
