import Link from "next/link";
import { BrandIdentityLink } from "@/shared/ui/BrandIdentityLink";

type LandingHeaderProps = {
  isLoggedIn: boolean;
  isLoginLoading: boolean;
  onLogin: () => void;
  onLogout: () => void;
};

export function LandingHeader({ isLoggedIn, isLoginLoading, onLogin, onLogout }: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-im-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-6">
        <BrandIdentityLink />
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/setup" className="rounded-full px-5 py-2 text-base font-bold text-im-text-main transition-colors hover:bg-im-surface">
            면접
          </Link>
          <Link href="/report" className="rounded-full px-5 py-2 text-base font-bold text-im-text-main transition-colors hover:bg-im-surface">
            리포트
          </Link>
          <Link href="/study" className="rounded-full px-5 py-2 text-base font-bold text-im-text-main transition-colors hover:bg-im-surface">
            학습
          </Link>

          <div className="ml-2 mr-1 h-6 w-px bg-im-border/80" />

          {!isLoggedIn ? (
            <button
              onClick={onLogin}
              disabled={isLoginLoading}
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-im-text-main transition-colors hover:bg-im-surface"
            >
              로그인
            </button>
          ) : (
            <button
              onClick={onLogout}
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-im-text-muted transition-colors hover:bg-red-50 hover:text-red-500"
            >
              로그아웃
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
