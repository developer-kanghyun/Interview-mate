"use client";

import { Button } from "@/shared/ui/Button";
import { BrandIdentityLink } from "@/shared/ui/BrandIdentityLink";
import type { UseInterviewShellStateResult } from "@/widgets/interview/model/useInterviewShellState";

type InterviewShellHeaderProps = {
  shellState: UseInterviewShellStateResult;
  isNavigationBusy: boolean;
};

export function InterviewShellHeader({ shellState, isNavigationBusy }: InterviewShellHeaderProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-im-border bg-white">
      <div className="mx-auto flex h-[60px] w-full max-w-6xl items-center gap-3 px-6">
        <BrandIdentityLink />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button
            variant={shellState.step === "setup" ? "primary" : "ghost"}
            onClick={() => shellState.setStep("setup")}
            disabled={isNavigationBusy}
            className="rounded-full px-6 py-2.5 text-base font-bold transition-transform"
          >
            면접
          </Button>
          <Button
            variant={shellState.step === "report" ? "primary" : "ghost"}
            onClick={() => shellState.setStep("report")}
            disabled={isNavigationBusy}
            className="rounded-full px-6 py-2.5 text-base font-bold transition-transform"
          >
            리포트
          </Button>
          <Button
            variant={shellState.step === "insights" ? "primary" : "ghost"}
            onClick={() => void shellState.handleGoInsights()}
            disabled={isNavigationBusy}
            className="rounded-full px-6 py-2.5 text-base font-bold transition-transform"
          >
            학습
          </Button>

          <div className="ml-2 mr-1 h-6 w-px bg-im-border/80" />

          {shellState.isMemberAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void shellState.handleGoogleLogout()}
              disabled={isNavigationBusy}
              className="rounded-full text-im-text-muted hover:bg-red-50 hover:text-red-500"
            >
              로그아웃
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void shellState.handleGoogleLogin()}
              disabled={isNavigationBusy}
              className="rounded-full shadow-sm"
            >
              로그인
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
