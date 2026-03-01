"use client";

import { useCallback, useMemo, useState } from "react";
import { getMyProfile } from "@/shared/api/interview";
import {
  getInterviewPreferences,
  setInterviewPreferences,
  type InterviewPreferences
} from "@/shared/config/interview-preferences";
import { SettingsAccountCard, type AccountState } from "@/features/settings/ui/SettingsAccountCard";
import { SettingsPreferencesCard } from "@/features/settings/ui/SettingsPreferencesCard";
import { defaultPreferences, stackOptionsByRole } from "@/features/settings/ui/settings.constants";

function getInitialPreferences() {
  return getInterviewPreferences() ?? defaultPreferences;
}

export function SettingsView() {
  const [preferences, setPreferences] = useState<InterviewPreferences>(getInitialPreferences);
  const [message, setMessage] = useState<string | null>(null);
  const [accountState, setAccountState] = useState<AccountState | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const stackOptions = useMemo(() => stackOptionsByRole[preferences.jobRole], [preferences.jobRole]);

  const loadAccount = useCallback(async () => {
    setIsLoadingAccount(true);
    setAccountError(null);
    try {
      const profile = await getMyProfile();
      setAccountState({
        name: profile.data.name ?? "이름 미등록",
        email: profile.data.email
      });
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "계정 정보를 불러오지 못했습니다.";
      setAccountError(nextMessage);
    } finally {
      setIsLoadingAccount(false);
    }
  }, []);

  const savePreferences = useCallback(() => {
    setInterviewPreferences(preferences);
    setMessage("면접 기본값이 저장되었습니다.");
  }, [preferences]);

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">설정</h1>
        <p className="text-sm text-slate-600">계정 상태와 면접 기본값을 관리합니다.</p>
      </header>

      <SettingsAccountCard
        accountState={accountState}
        accountError={accountError}
        isLoadingAccount={isLoadingAccount}
        onLoadAccount={() => void loadAccount()}
      />

      <SettingsPreferencesCard
        preferences={preferences}
        stackOptions={stackOptions}
        message={message}
        onSave={savePreferences}
        onChangePreferences={setPreferences}
        onClearMessage={() => setMessage(null)}
      />
    </main>
  );
}
