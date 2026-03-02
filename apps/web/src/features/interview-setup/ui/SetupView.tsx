"use client";

import { useEffect, useState } from "react";
import type { StartInterviewPayload } from "@/features/interview/start-session/model/application/startInterviewSessionUseCase";
import { SetupActions } from "@/features/interview-setup/ui/SetupActions";
import { SetupProgress } from "@/features/interview-setup/ui/SetupProgress";
import { SetupStepCharacter } from "@/features/interview-setup/ui/SetupStepCharacter";
import { SetupStepRole } from "@/features/interview-setup/ui/SetupStepRole";
import { SetupStepStack } from "@/features/interview-setup/ui/SetupStepStack";
import { stacksByJobId, type VisualJobId } from "@/features/interview-setup/ui/setupView.constants";
import { parseSetupStacksUseCase } from "@/features/interview-setup/model/application/setupStackUseCases";

type SetupViewProps = {
  value: StartInterviewPayload;
  onChange: (next: StartInterviewPayload) => void;
  onStart: () => void;
  isStarting: boolean;
  canStart?: boolean;
};

export function SetupView({ value, onChange, onStart, isStarting, canStart = true }: SetupViewProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedStacks, setSelectedStacks] = useState<string[]>([]);
  const [visualJobId, setVisualJobId] = useState<VisualJobId>("frontend");
  const isSetupBusy = isStarting;
  const isNextDisabled = isSetupBusy || (step === 2 && selectedStacks.length === 0);
  const isStartDisabled = isSetupBusy || !canStart;

  const currentStackOptions = stacksByJobId[visualJobId];

  useEffect(() => {
    const parsedStacks = parseSetupStacksUseCase(value.stack, currentStackOptions);
    setSelectedStacks((previous) => (previous.join("|") === parsedStacks.join("|") ? previous : parsedStacks));
  }, [currentStackOptions, value.stack]);

  const nextStep = () => {
    setStep((previous) => (previous === 3 ? 3 : ((previous + 1) as 1 | 2 | 3)));
  };

  const previousStep = () => {
    setStep((previous) => (previous === 1 ? 1 : ((previous - 1) as 1 | 2 | 3)));
  };

  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="overflow-hidden rounded-[2rem] border border-im-border/60 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-im-primary-strong">Interview Setup</p>
            <p className="mt-1 text-sm font-semibold text-im-text-muted sm:text-base">직무, 난이도, 면접관을 순서대로 선택하세요.</p>
          </div>
        </div>

        <SetupProgress step={step} />

        {step === 1 ? (
          <div key="step1" className="transition-all duration-300 ease-out">
            <SetupStepRole
              value={value}
              onChange={onChange}
              isSetupBusy={isSetupBusy}
              visualJobId={visualJobId}
              setVisualJobId={setVisualJobId}
              setSelectedStacks={setSelectedStacks}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div key="step2" className="transition-all duration-300 ease-out">
            <SetupStepStack
              value={value}
              onChange={onChange}
              isSetupBusy={isSetupBusy}
              currentStackOptions={currentStackOptions}
              selectedStacks={selectedStacks}
              setSelectedStacks={setSelectedStacks}
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div key="step3" className="transition-all duration-300 ease-out">
            <SetupStepCharacter value={value} onChange={onChange} isSetupBusy={isSetupBusy} />
          </div>
        ) : null}

        <SetupActions
          step={step}
          previousStep={previousStep}
          nextStep={nextStep}
          isSetupBusy={isSetupBusy}
          isNextDisabled={isNextDisabled}
          onStart={onStart}
          isStartDisabled={isStartDisabled}
          isStarting={isStarting}
          canStart={canStart}
        />
      </div>
    </div>
  );
}
