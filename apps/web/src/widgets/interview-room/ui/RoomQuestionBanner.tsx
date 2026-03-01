"use client";

import { Button } from "@/shared/ui/Button";

type RoomQuestionBannerProps = {
  isAutoplayBlocked: boolean;
  playTtsAudio: () => void;
  questionOrder: number;
  totalQuestions: number;
  followupCount: number;
  streamingQuestionText: string;
  isQuestionStreaming: boolean;
  isResumeResolving: boolean;
};

export function RoomQuestionBanner({
  isAutoplayBlocked,
  playTtsAudio,
  questionOrder,
  totalQuestions,
  followupCount,
  streamingQuestionText,
  isQuestionStreaming,
  isResumeResolving
}: RoomQuestionBannerProps) {
  return (
    <div
      data-testid="room-question-banner"
      className="shrink-0 border-b border-slate-200/70 bg-gradient-to-r from-im-primary-soft via-white to-im-subtle px-5 py-4"
    >
      {isAutoplayBlocked ? (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={playTtsAudio}
            className="h-7 border-rose-200 bg-rose-50 px-3 text-xs text-rose-600 hover:bg-rose-100 hover:text-rose-700"
          >
            질문 듣기
          </Button>
        </div>
      ) : null}
      <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-im-text-main sm:text-lg sm:leading-8">
        <span className="mr-2 text-sm font-black text-im-primary sm:text-base">
          {questionOrder}/{totalQuestions}
        </span>
        {followupCount > 0 ? (
          <span className="mr-2 text-sm font-semibold text-emerald-700 sm:text-base">(꼬리질문)</span>
        ) : null}
        {streamingQuestionText || "질문을 불러오는 중입니다..."}
        {isQuestionStreaming ? <span className="sse-caret" /> : null}
      </p>
      {isResumeResolving ? (
        <p className="mt-2 text-xs font-medium text-im-text-muted">이전 세션 복구 중입니다...</p>
      ) : null}
    </div>
  );
}
