"use client";

import { Button } from "@/shared/ui/Button";
import { Select } from "@/shared/ui/Select";
import { Chip } from "@/shared/ui/Chip";
import { useMemo, useState } from "react";
import InterviewerAvatarAnimated from "@/shared/ui/InterviewerAvatarAnimated";
import type { InterviewCharacter, InterviewRole, StartInterviewPayload } from "@/shared/api/interview-client";
import { motion } from "framer-motion";

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

  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="overflow-hidden rounded-[2rem] border border-im-border/60 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-im-primary">Interview Setup</p>
            <p className="mt-1 text-xs text-im-text-muted">직무, 난이도, 면접관을 순서대로 선택하세요.</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-[width,background-color] duration-300 ${
                s === step ? "w-8 bg-im-primary" : s < step ? "w-2 bg-im-primary/40" : "w-2 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Job Role */}
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center gap-8 rounded-2xl border border-im-border/50 bg-im-subtle p-5 sm:p-6"
          >
            <div className="text-center">
              <h1 className="text-2xl font-black tracking-tight text-im-text-main sm:text-3xl">
                어떤 직무의 면접을 준비하시나요?
              </h1>
              <p className="mt-2 text-sm text-im-text-muted">
                선택한 직무에 맞춘 AI 면접관이 배정됩니다.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 md:grid-cols-3">
              {(
                [
                  { id: "frontend", label: "프론트엔드", role: "frontend" },
                  { id: "backend", label: "백엔드", role: "backend" },
                  { id: "app", label: "앱개발 (iOS/Android)", role: "frontend" },
                  { id: "cloud", label: "클라우드 엔지니어링", role: "backend" },
                  { id: "data", label: "데이터 분석", role: "backend" },
                  { id: "design", label: "디자인 / 마케팅", role: "frontend" }
                ] as const
              ).map((job) => {
                // Since our system currently relies on "frontend" or "backend" for InterviewRole tracking,
                // we'll visually show the specific selected "id", but pass the appropriate payload.
                const isSelected = value.jobRole === job.role && (value as any)._visualJobRole === job.id;

                return (
                  <button
                    key={job.id}
                    type="button"
                    disabled={isSetupBusy}
                    className={`rounded-2xl border px-3 py-6 text-center transition-[background-color,border-color,box-shadow,transform] ${
                      isSelected
                        ? "border-im-primary bg-white ring-1 ring-im-primary shadow-sm"
                        : "border-im-border bg-white hover:-translate-y-0.5 hover:border-im-primary/30 hover:shadow-glow"
                    }`}
                    onClick={() =>
                      onChange({
                        ...value,
                        jobRole: job.role,
                        stack: stackOptionsMap[job.role][0],
                        _visualJobRole: job.id // Store visual state temporarily, gets ignored by API
                      } as StartInterviewPayload)
                    }
                  >
                    <p className={`text-base font-bold ${isSelected ? "text-im-primary" : "text-im-text-main"} tracking-tight`}>
                      {job.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}

        {/* Step 2: Stack & Difficulty */}
        {step === 2 ? (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center gap-8 rounded-2xl border border-im-border/50 bg-im-subtle p-5 sm:p-6"
          >
            <div className="text-center">
              <h1 className="text-2xl font-black tracking-tight text-im-text-main sm:text-3xl">
                기술 스택과 난이도를 알려주세요.
              </h1>
            </div>
            <div className="grid w-full gap-5">
              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-im-text-muted">기술 스택</span>
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

              <label className="grid gap-1.5">
                <span className="text-xs font-bold text-im-text-muted">면접 난이도</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["jobseeker", "junior"] as const).map((difficulty) => (
                    <button
                      key={difficulty}
                      type="button"
                      disabled={isSetupBusy}
                      className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition-[background-color,border-color,box-shadow,color,transform] ${
                        value.difficulty === difficulty
                          ? "border-im-primary bg-white ring-1 ring-im-primary text-im-primary shadow-sm"
                          : "border-im-border bg-white text-im-text-main hover:border-im-primary/30 hover:shadow-sm"
                      }`}
                      onClick={() => onChange({ ...value, difficulty })}
                    >
                      {difficulty === "jobseeker" ? "취준생" : "주니어"}
                    </button>
                  ))}
                </div>
              </label>
            </div>
          </motion.div>
        ) : null}

        {/* Step 3: Interviewer */}
        {step === 3 ? (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center gap-8 rounded-2xl border border-im-border/50 bg-im-subtle p-5 sm:p-6"
          >
            <div className="text-center">
              <h1 className="text-2xl font-black tracking-tight text-im-text-main sm:text-3xl">
                면접관을 선택해주세요.
              </h1>
              <p className="mt-2 text-sm text-im-text-muted">
                한 명을 선택하고 면접을 시작하세요.
              </p>
            </div>
            <div className="grid w-full gap-3">
              {characterOptions.map((character) => (
                <button
                  key={character.key}
                  type="button"
                  disabled={isSetupBusy}
                  className={`rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow,opacity] ${
                    value.character === character.key
                      ? "border-im-primary bg-white ring-1 ring-im-primary shadow-sm"
                      : "border-im-border bg-white opacity-80 hover:border-im-primary/30 hover:opacity-100 hover:shadow-sm"
                  }`}
                  onClick={() => onChange({ ...value, character: character.key })}
                >
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <InterviewerAvatarAnimated
                        character={character.key === "zet" ? "jet" : character.key}
                        emotion="neutral"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${value.character === character.key ? "text-im-primary" : "text-im-text-main"}`}>
                          {character.name}
                        </p>
                        {value.character === character.key ? <Chip variant="info">선택됨</Chip> : null}
                      </div>
                      <p className="mt-1 text-xs text-im-text-muted">{character.summary}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}

        {/* Actions */}
      <div className="mt-7 flex items-center justify-between gap-3 border-t border-im-border/50 pt-4">
        <Button variant="ghost" onClick={previousStep} disabled={step === 1 || isSetupBusy} className="px-6">
          ← 이전
        </Button>

        {step < 3 ? (
          <Button onClick={nextStep} disabled={isSetupBusy} className="px-6">
            다음 →
          </Button>
        ) : (
          <Button onClick={onStart} disabled={isStarting} className="min-w-[180px] shadow-glow">
            {isStarting ? "면접 준비 중..." : "🚀 면접 시작"}
          </Button>
        )}
      </div>
      </motion.div>
    </div>
  );
}
