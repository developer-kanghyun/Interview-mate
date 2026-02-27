"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { getMyProfile } from "@/shared/api/interview";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Select } from "@/shared/ui/Select";
import {
  getInterviewPreferences,
  setInterviewPreferences,
  type InterviewPreferences
} from "@/shared/config/interview-preferences";

const defaultPreferences: InterviewPreferences = {
  jobRole: "backend",
  stack: "Spring Boot",
  difficulty: "jobseeker",
  character: "zet"
};

const stackOptionsByRole: Record<InterviewPreferences["jobRole"], string[]> = {
  backend: ["Spring Boot", "NestJS", "Node.js"],
  frontend: ["React", "Next.js", "Vue"],
  app: ["React Native", "Flutter", "Swift", "Kotlin"],
  cloud: ["AWS", "GCP", "Kubernetes", "Terraform"],
  data: ["Python", "SQL", "Pandas", "Spark"],
  design: ["Figma", "UX Research", "Google Analytics", "SEO"],
  pm: ["PRD", "Roadmap", "A/B Testing", "Jira"]
};

function getInitialPreferences() {
  return getInterviewPreferences() ?? defaultPreferences;
}

type AccountState = {
  name: string;
  email: string | null;
};

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

      <Card title="계정">
        <div className="space-y-3 text-sm text-slate-700">
          {accountState ? (
            <div className="space-y-1">
              <p>이름: {accountState.name}</p>
              <p>이메일: {accountState.email ?? "게스트 계정"}</p>
            </div>
          ) : null}

          {accountError ? <p className="text-rose-600">{accountError}</p> : null}

          <Button variant="secondary" onClick={() => void loadAccount()} disabled={isLoadingAccount}>
            {isLoadingAccount ? "불러오는 중..." : accountState ? "다시 불러오기" : "계정 정보 불러오기"}
          </Button>
        </div>
      </Card>

      <Card title="면접 기본값" description="Setup 진입 시 아래 값이 기본 선택값으로 적용됩니다.">
        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700">직무</span>
            <Select
              value={preferences.jobRole}
              onChange={(event) => {
                const nextRole = event.target.value as InterviewPreferences["jobRole"];
                setPreferences((previous) => ({
                  ...previous,
                  jobRole: nextRole,
                  stack: stackOptionsByRole[nextRole][0]
                }));
                setMessage(null);
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
                setPreferences((previous) => ({
                  ...previous,
                  stack: nextStack
                }));
                setMessage(null);
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
                setPreferences((previous) => ({
                  ...previous,
                  difficulty: nextDifficulty
                }));
                setMessage(null);
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
                setPreferences((previous) => ({
                  ...previous,
                  character: nextCharacter
                }));
                setMessage(null);
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
          <Button onClick={savePreferences}>저장</Button>
        </div>
        {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
      </Card>
    </main>
  );
}
