import { Button } from "@/shared/ui/Button";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";

type ResumeSessionModalProps = {
  sessionId: string;
  isGuest: boolean;
  isLoading: boolean;
  onContinue: () => void | Promise<void>;
  onStartNew: () => void;
};

export function ResumeSessionModal({ sessionId, isGuest, isLoading, onContinue, onStartNew }: ResumeSessionModalProps) {
  const continueLabel = isGuest ? "로그인 후 이어하기" : "이어하기";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="세션 재개 확인"
        className="w-full max-w-md rounded-2xl border border-white/80 bg-white p-5 shadow-glass"
      >
        <div className="space-y-2">
          <p className="text-lg font-bold text-slate-900">이전 세션을 이어할까요?</p>
          <p className="text-sm leading-6 text-slate-600">
            진행 중인 면접 세션({sessionId})이 있습니다. 이어서 진행하거나 새 면접을 시작할 수 있습니다.
          </p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onStartNew} disabled={isLoading}>
            새 면접 시작
          </Button>
          <Button onClick={() => void onContinue()} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" tone="on-primary" />
                처리 중...
              </>
            ) : (
              continueLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
