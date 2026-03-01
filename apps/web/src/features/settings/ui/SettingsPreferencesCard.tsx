"use client";

import Link from "next/link";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Select } from "@/shared/ui/Select";
import type { InterviewPreferences } from "@/shared/config/interview-preferences";
import { stackOptionsByRole } from "@/features/settings/ui/settings.constants";

type SettingsPreferencesCardProps = {
  preferences: InterviewPreferences;
  stackOptions: string[];
  message: string | null;
  onSave: () => void;
  onChangePreferences: (updater: (previous: InterviewPreferences) => InterviewPreferences) => void;
  onClearMessage: () => void;
};

export function SettingsPreferencesCard({
  preferences,
  stackOptions,
  message,
  onSave,
  onChangePreferences,
  onClearMessage
}: SettingsPreferencesCardProps) {
  return (
    <Card title="면접 기본값" description="Setup 진입 시 아래 값이 기본 선택값으로 적용됩니다.">
      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-700">직무</span>
          <Select
            value={preferences.jobRole}
            onChange={(event) => {
              const nextRole = event.target.value as InterviewPreferences["jobRole"];
              onChangePreferences((previous) => ({
                ...previous,
                jobRole: nextRole,
                stack: stackOptionsByRole[nextRole][0]
              }));
              onClearMessage();
            }}
          >
            <option value="backend">백엔드</option>
            <option value="frontend">프론트엔드</option>
            <option value="app">앱개발</option>
            <option value="cloud">클라우드 엔지니어링</option>
            <option value="data">데이터 분석</option>
            <option value="design">디자인/마케팅</option>
            <option value="pm">PM</option>
          </Select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-700">스택</span>
          <Select
            value={preferences.stack}
            onChange={(event) => {
              const nextStack = event.target.value;
              onChangePreferences((previous) => ({
                ...previous,
                stack: nextStack
              }));
              onClearMessage();
            }}
          >
            {stackOptions.map((stack) => (
              <option key={stack} value={stack}>
                {stack}
              </option>
            ))}
          </Select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-700">난이도</span>
          <Select
            value={preferences.difficulty}
            onChange={(event) => {
              const nextDifficulty = event.target.value as InterviewPreferences["difficulty"];
              onChangePreferences((previous) => ({
                ...previous,
                difficulty: nextDifficulty
              }));
              onClearMessage();
            }}
          >
            <option value="jobseeker">취준생</option>
            <option value="junior">주니어</option>
          </Select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-700">면접관</span>
          <Select
            value={preferences.character}
            onChange={(event) => {
              const nextCharacter = event.target.value as InterviewPreferences["character"];
              onChangePreferences((previous) => ({
                ...previous,
                character: nextCharacter
              }));
              onClearMessage();
            }}
          >
            <option value="zet">제트</option>
            <option value="luna">루나</option>
            <option value="iron">아이언</option>
          </Select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Link href="/setup">
          <Button variant="secondary">설정으로 이동</Button>
        </Link>
        <Button onClick={onSave}>저장</Button>
      </div>
      {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
    </Card>
  );
}
