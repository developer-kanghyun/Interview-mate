import type { StartInterviewPayload } from "@/features/interview/start-session/model/application/startInterviewSessionUseCase";
import type { Dispatch, SetStateAction } from "react";
import { jobOptions, stepBodyClass, type VisualJobId } from "@/features/interview-setup/ui/setupView.constants";

type SetupStepRoleProps = {
  value: StartInterviewPayload;
  onChange: (next: StartInterviewPayload) => void;
  isSetupBusy: boolean;
  visualJobId: VisualJobId;
  setVisualJobId: Dispatch<SetStateAction<VisualJobId>>;
  setSelectedStacks: Dispatch<SetStateAction<string[]>>;
};

export function SetupStepRole({
  value,
  onChange,
  isSetupBusy,
  visualJobId,
  setVisualJobId,
  setSelectedStacks
}: SetupStepRoleProps) {
  return (
    <div className={stepBodyClass}>
      <div className="text-center">
        <h1 className="text-2xl font-black tracking-tight text-im-text-main sm:text-3xl">어떤 직무의 면접을 준비하시나요?</h1>
        <p className="mt-2 text-sm text-im-text-muted">선택한 직무에 맞춘 AI 면접관이 배정됩니다.</p>
      </div>
      <div className="grid w-full gap-3 sm:grid-cols-2 md:grid-cols-3">
        {jobOptions.map((job) => {
          const isSelected = visualJobId === job.id;

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
              onClick={() => {
                setVisualJobId(job.id);
                setSelectedStacks([]);
                onChange({
                  ...value,
                  jobRole: job.id,
                  stack: ""
                });
              }}
            >
              <p className={`text-base font-bold tracking-tight ${isSelected ? "text-im-primary-strong" : "text-im-text-main"}`}>
                {job.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
