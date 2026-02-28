import { Button } from "@/shared/ui/Button";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";

type SetupActionsProps = {
  step: 1 | 2 | 3;
  previousStep: () => void;
  nextStep: () => void;
  isSetupBusy: boolean;
  isNextDisabled: boolean;
  onStart: () => void;
  isStartDisabled: boolean;
  isStarting: boolean;
  canStart: boolean;
};

export function SetupActions({
  step,
  previousStep,
  nextStep,
  isSetupBusy,
  isNextDisabled,
  onStart,
  isStartDisabled,
  isStarting,
  canStart
}: SetupActionsProps) {
  return (
    <div className="mt-7 flex items-center justify-between gap-3 border-t border-im-border/50 pt-4">
      <Button variant="ghost" onClick={previousStep} disabled={step === 1 || isSetupBusy} className="px-6">
        이전
      </Button>

      {step < 3 ? (
        <Button onClick={nextStep} disabled={isNextDisabled} className="px-6">
          다음
        </Button>
      ) : (
        <Button onClick={onStart} disabled={isStartDisabled} className="min-w-[180px] gap-2 shadow-glow">
          {isStarting ? (
            <>
              <LoadingSpinner size="sm" tone="on-primary" />
              면접 준비 중...
            </>
          ) : !canStart ? (
            "인증 확인 중..."
          ) : (
            "면접 시작"
          )}
        </Button>
      )}
    </div>
  );
}
