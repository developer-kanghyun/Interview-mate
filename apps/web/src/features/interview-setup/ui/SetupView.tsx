import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Select } from "@/shared/ui/Select";
import { Chip } from "@/shared/ui/Chip";
import { useMemo, useState } from "react";
import InterviewerAvatarAnimated from "@/shared/ui/InterviewerAvatarAnimated";
import type { InterviewCharacter, InterviewRole, StartInterviewPayload } from "@/shared/api/interview-client";

type SetupViewProps = {
  value: StartInterviewPayload;
  onChange: (next: StartInterviewPayload) => void;
  onStart: () => void;
  isStarting: boolean;
  canStart?: boolean;
};

const stackOptionsMap: Record<InterviewRole, string[]> = {
  backend: ["Spring Boot", "NestJS", "Node.js"],
  frontend: ["React", "Next.js", "Vue"]
};

const characterOptions: Array<{
  key: InterviewCharacter;
  name: string;
  summary: string;
}> = [
  {
    key: "luna",
    name: "루나",
    summary: "밝은 톤의 안내형. 답변 구조를 부드럽게 교정합니다."
  },
  {
    key: "zet",
    name: "제트",
    summary: "차분한 실전형. 실무 기준의 근거를 요청합니다."
  },
  {
    key: "iron",
    name: "아이언",
    summary: "강한 압박형. 약한 답변엔 꼬리질문을 집요하게 이어갑니다."
  }
];

export function SetupView({ value, onChange, onStart, isStarting, canStart = true }: SetupViewProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const stackOptions = useMemo(() => stackOptionsMap[value.jobRole], [value.jobRole]);
  const isSetupBusy = isStarting;

  const nextStep = () => {
    setStep((previous) => (previous === 3 ? 3 : ((previous + 1) as 1 | 2 | 3)));
  };

  const previousStep = () => {
    setStep((previous) => (previous === 1 ? 1 : ((previous - 1) as 1 | 2 | 3)));
  };

  const stepLabel = step === 1 ? "Step 1 · 직무 선택" : step === 2 ? "Step 2 · 스택/난이도" : "Step 3 · 면접관 선택";

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">면접 탭</h1>
        <p className="text-sm text-slate-600">3단계로 조건을 선택하고 바로 모의면접을 시작합니다.</p>
        <div className="flex items-center gap-2">
          <Chip variant="info">{stepLabel}</Chip>
          <Chip variant="default">{step}/3</Chip>
        </div>
      </header>

      {step === 1 ? (
        <Card title="직무 선택" description="질문 분배는 직무 비중을 우선으로 하되 공통 질문이 일부 섞입니다.">
          <div className="grid gap-2 sm:grid-cols-2">
            {(["backend", "frontend"] as const).map((jobRole) => (
              <button
                key={jobRole}
                type="button"
                disabled={isSetupBusy}
                className={`rounded-xl border p-4 text-left transition ${
                  value.jobRole === jobRole
                    ? "border-blue-500 bg-blue-600 text-white ring-4 ring-blue-100"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                }`}
                onClick={() =>
                  onChange({
                    ...value,
                    jobRole,
                    stack: stackOptionsMap[jobRole][0]
                  })
                }
              >
                <p className="text-sm font-semibold">{jobRole === "backend" ? "백엔드" : "프론트엔드"}</p>
                <p className={`mt-1 text-xs ${value.jobRole === jobRole ? "text-blue-50" : "text-slate-500"}`}>
                  {jobRole === "backend" ? "API/DB/성능/아키텍처 중심" : "UI/상태/성능/접근성 중심"}
                </p>
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card title="기술 스택 / 난이도">
          <div className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-700">스택</span>
              <Select
                value={value.stack}
                disabled={isSetupBusy}
                onChange={(event) => onChange({ ...value, stack: event.target.value })}
              >
                {stackOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-semibold text-slate-700">난이도</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["jobseeker", "junior"] as const).map((difficulty) => (
                  <button
                    key={difficulty}
                    type="button"
                    disabled={isSetupBusy}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      value.difficulty === difficulty
                        ? "border-blue-500 bg-blue-600 text-white ring-4 ring-blue-100"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                    }`}
                    onClick={() => onChange({ ...value, difficulty })}
                  >
                    {difficulty === "jobseeker" ? "취준생" : "주니어"}
                  </button>
                ))}
              </div>
            </label>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card title="면접관 선택" description="한 명을 선택하고 면접을 시작하세요.">
          <div className="grid gap-2">
            {characterOptions.map((character) => (
              <button
                key={character.key}
                type="button"
                disabled={isSetupBusy}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  value.character === character.key
                    ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                }`}
                onClick={() => onChange({ ...value, character: character.key })}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <InterviewerAvatarAnimated
                      character={character.key === "zet" ? "jet" : character.key}
                      emotion="neutral"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{character.name}</p>
                      <p className="mt-1 text-xs text-slate-600">{character.summary}</p>
                    </div>
                  </div>
                  {value.character === character.key ? <Chip variant="info">선택됨</Chip> : null}
                </div>
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="secondary" onClick={previousStep} disabled={step === 1 || isSetupBusy}>
          이전
        </Button>

        {step < 3 ? (
          <Button onClick={nextStep} disabled={isSetupBusy}>
            다음
          </Button>
        ) : (
          <Button onClick={onStart} disabled={isStarting || !canStart} className="min-w-[180px]">
            {isStarting ? "면접 준비 중..." : canStart ? "면접 시작" : "로그인 후 시작"}
          </Button>
        )}
      </div>
    </div>
  );
}
