import type { AuthMeApiResponse } from "@/features/settings/model/application/loadSettingsAccountUseCase";

export type SettingsAccountState = {
  name: string;
  email: string | null;
};

export function mapSettingsAccountState(profile: AuthMeApiResponse["data"]): SettingsAccountState {
  return {
    name: profile.name ?? "이름 미등록",
    email: profile.email
  };
}
