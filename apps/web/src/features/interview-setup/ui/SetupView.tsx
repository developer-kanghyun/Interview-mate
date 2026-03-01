"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { StartInterviewPayload } from "@/features/interview/start-session/model/application/startInterviewSessionUseCase";
import { SetupActions } from "@/features/interview-setup/ui/SetupActions";
import { SetupProgress } from "@/features/interview-setup/ui/SetupProgress";
import { SetupStepCharacter } from "@/features/interview-setup/ui/SetupStepCharacter";
import { SetupStepRole } from "@/features/interview-setup/ui/SetupStepRole";
import { SetupStepStack } from "@/features/interview-setup/ui/SetupStepStack";
import { stacksByJobId, type VisualJobId } from "@/features/interview-setup/ui/setupView.constants";
import { parseSelectedStacks } from "@/features/interview-setup/model/domain/setupStackPolicy";

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
    const parsedStacks = parseSelectedStacks(value.stack, currentStackOptions);
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
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="overflow-hidden rounded-[2rem] border border-im-border/60 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-im-primary">Interview Setup</p>
            <p className="mt-1 text-sm font-semibold text-im-text-muted sm:text-base">직무, 난이도, 면접관을 순서대로 선택하세요.</p>
          </div>
        </div>

        <SetupProgress step={step} />

        {step === 1 ? (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
            <SetupStepRole
              value={value}
              onChange={onChange}
              isSetupBusy={isSetupBusy}
              visualJobId={visualJobId}
              setVisualJobId={setVisualJobId}
              setSelectedStacks={setSelectedStacks}
            />
          </motion.div>
        ) : null}

        {step === 2 ? (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
            <SetupStepStack
              value={value}
              onChange={onChange}
              isSetupBusy={isSetupBusy}
              currentStackOptions={currentStackOptions}
              selectedStacks={selectedStacks}
              setSelectedStacks={setSelectedStacks}
            />
          </motion.div>
        ) : null}

        {step === 3 ? (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
            <SetupStepCharacter value={value} onChange={onChange} isSetupBusy={isSetupBusy} />
          </motion.div>
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
      </motion.div>
    </div>
  );
}
