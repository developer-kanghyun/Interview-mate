import type { StartInterviewPayload } from "@/features/interview/start-session/model/application/startInterviewSessionUseCase";
import type { Dispatch, SetStateAction } from "react";
import { MAX_STACKS, stepBodyClass } from "@/features/interview-setup/ui/setupView.constants";
import {
  serializeSetupStacksUseCase,
  toggleSetupStackUseCase
} from "@/features/interview-setup/model/application/setupStackUseCases";

type SetupStepStackProps = {
  value: StartInterviewPayload;
  onChange: (next: StartInterviewPayload) => void;
  isSetupBusy: boolean;
  currentStackOptions: string[];
  selectedStacks: string[];
  setSelectedStacks: Dispatch<SetStateAction<string[]>>;
};

export function SetupStepStack({
  value,
  onChange,
  isSetupBusy,
  currentStackOptions,
  selectedStacks,
  setSelectedStacks
}: SetupStepStackProps) {
  return (
    <div className={stepBodyClass}>
      <div className="text-center">
        <h1 className="text-2xl font-black tracking-tight text-im-text-main sm:text-3xl">기술 스택과 난이도를 알려주세요.</h1>
      </div>
      <div className="grid w-full gap-6">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-im-text-muted">기술 스택 (최대 {MAX_STACKS}개)</span>
            <span className={`text-xs font-semibold ${selectedStacks.length === MAX_STACKS ? "text-im-primary" : "text-im-text-muted"}`}>
              {selectedStacks.length} / {MAX_STACKS}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentStackOptions.map((stack) => {
              const isChosen = selectedStacks.includes(stack);
              const isDisabled = isSetupBusy || (!isChosen && selectedStacks.length >= MAX_STACKS);
              return (
                <button
                  key={stack}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    const next = toggleSetupStackUseCase(selectedStacks, stack, MAX_STACKS);
                    setSelectedStacks(next);
                    onChange({ ...value, stack: serializeSetupStacksUseCase(next) });
                  }}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-[background-color,border-color,color,opacity] ${
                    isChosen
                      ? "border-im-primary bg-im-primary text-white shadow-sm"
                      : isDisabled
                        ? "cursor-not-allowed border-im-border bg-white text-im-text-muted opacity-40"
                        : "border-im-border bg-white text-im-text-main hover:border-im-primary/50 hover:bg-im-surface"
                  }`}
                >
                  {stack}
                </button>
              );
            })}
          </div>
          {selectedStacks.length === 0 && <p className="text-xs text-im-text-muted">면접에서 다룰 스택을 선택해주세요.</p>}
        </div>

        <label className="grid gap-2">
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
    </div>
  );
}
