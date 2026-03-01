"use client";

import { Button } from "@/shared/ui/Button";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";
import { BrandIdentityLink } from "@/shared/ui/BrandIdentityLink";

type RoomHeaderProps = {
  jobRoleLabel: string;
  stackLabel: string;
  difficultyLabel: string;
  canExit: boolean;
  isExiting: boolean;
  onExit: () => void;
};

export function RoomHeader({
  jobRoleLabel,
  stackLabel,
  difficultyLabel,
  canExit,
  isExiting,
  onExit
}: RoomHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[60px] shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-6">
        <BrandIdentityLink className="shrink-0" />
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <p className="hidden min-w-0 max-w-[860px] truncate text-sm font-semibold text-slate-700 md:block lg:text-base">
            {jobRoleLabel}
            <span className="mx-2 text-slate-300">|</span>
            {stackLabel}
            <span className="mx-2 text-slate-300">|</span>
            {difficultyLabel}
          </p>
        </div>
      </div>

      <Button
        variant="ghost"
        onClick={onExit}
        disabled={!canExit}
        className="gap-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600"
      >
        {isExiting ? (
          <>
            <LoadingSpinner size="sm" tone="primary" />
            리포트 불러오는 중...
          </>
        ) : (
          "나가기"
        )}
      </Button>
    </header>
  );
}
