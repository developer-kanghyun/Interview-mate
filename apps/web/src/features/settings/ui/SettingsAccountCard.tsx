"use client";

import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";

export type AccountState = {
  name: string;
  email: string | null;
};

type SettingsAccountCardProps = {
  accountState: AccountState | null;
  accountError: string | null;
  isLoadingAccount: boolean;
  onLoadAccount: () => void;
};

export function SettingsAccountCard({
  accountState,
  accountError,
  isLoadingAccount,
  onLoadAccount
}: SettingsAccountCardProps) {
  return (
    <Card title="계정">
      <div className="space-y-3 text-sm text-slate-700">
        {accountState ? (
          <div className="space-y-1">
            <p>이름: {accountState.name}</p>
            <p>이메일: {accountState.email ?? "게스트 계정"}</p>
          </div>
        ) : null}

        {accountError ? <p className="text-rose-600">{accountError}</p> : null}

        <Button variant="secondary" onClick={onLoadAccount} disabled={isLoadingAccount} className="gap-2">
          {isLoadingAccount ? (
            <>
              <LoadingSpinner size="sm" tone="primary" />
              불러오는 중...
            </>
          ) : accountState ? (
            "다시 불러오기"
          ) : (
            "계정 정보 불러오기"
          )}
        </Button>
      </div>
    </Card>
  );
}
