import { Button } from "@/shared/ui/Button";

type LoginRequiredModalProps = {
  message: string;
  onLogin: () => void | Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
};

export function LoginRequiredModal({ message, onLogin, onClose, isLoading = false }: LoginRequiredModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="로그인 필요"
        className="w-full max-w-md rounded-2xl border border-white/80 bg-white p-5 shadow-glass"
      >
        <div className="space-y-2">
          <p className="text-lg font-bold text-slate-900">로그인이 필요합니다</p>
          <p className="text-sm leading-6 text-slate-600">{message}</p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            닫기
          </Button>
          <Button onClick={() => void onLogin()} disabled={isLoading}>
            {isLoading ? "로그인 이동 중..." : "Google 로그인"}
          </Button>
        </div>
      </div>
    </div>
  );
}
