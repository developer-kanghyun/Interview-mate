"use client";

import dynamic from "next/dynamic";
import { useCallback, type FocusEvent, type KeyboardEvent, type RefObject } from "react";
import { ChatBoard, type ChatMessage } from "@/shared/chat/ChatBoard";
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Textarea";
import { Mic, MicOff } from "lucide-react";

import type { InterviewCharacter, InterviewEmotion } from "@/shared/api/interview-client";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";

const InterviewerAvatarAnimated = dynamic(
  () => import("@/entities/avatar/ui/InterviewerAvatarAnimated").then((module) => module.InterviewerAvatarAnimated),
  { ssr: false }
);

type RoomViewProps = {
  character: InterviewCharacter;
  avatarState: AvatarState;
  avatarCueToken: number;
  emotion: InterviewEmotion;
  audioRef: RefObject<HTMLAudioElement>;
  isAutoplayBlocked: boolean;
  playTtsAudio: () => void;
  isRecording: boolean;
  isSttBusy: boolean;
  onToggleRecording: () => void;
  reactionEnabled: boolean;
  jobRoleLabel: string;
  stackLabel: string;
  difficultyLabel: string;
  questionOrder: number;
  totalQuestions: number;
  streamingQuestionText: string;
  isQuestionStreaming: boolean;
  isResumeResolving: boolean;
  messages: ChatMessage[];
  answerText: string;
  onChangeAnswer: (value: string) => void;
  isSubmitting: boolean;
  onSubmitAnswer: () => void;
  isExiting: boolean;
  onExit: () => void;
};

export function RoomView({
  character,
  avatarState,
  avatarCueToken,
  emotion,
  audioRef,
  isAutoplayBlocked,
  playTtsAudio,
  isRecording,
  isSttBusy,
  onToggleRecording,
  reactionEnabled,
  jobRoleLabel,
  stackLabel,
  difficultyLabel,
  questionOrder,
  totalQuestions,
  streamingQuestionText,
  isQuestionStreaming,
  isResumeResolving,
  messages,
  answerText,
  onChangeAnswer,
  isSubmitting,
  onSubmitAnswer,
  isExiting,
  onExit
}: RoomViewProps) {
  const visibleMessages = messages.filter((message) => message.role !== "interviewer");
  const isBusy = isExiting || isSubmitting || isResumeResolving;
  const canExit = !isBusy;
  const canSubmitAnswer = !isBusy && !isQuestionStreaming && answerText.trim().length > 0;
  const handleFocusAnswer = useCallback((event: FocusEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    if (window.innerWidth >= 1024) {
      return;
    }
    window.requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest"
      });
    });
  }, []);

  const handleAnswerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Enter" || event.shiftKey) {
        return;
      }
      if (event.nativeEvent.isComposing || event.keyCode === 229) {
        return;
      }
      event.preventDefault();
      if (!canSubmitAnswer) {
        return;
      }
      onSubmitAnswer();
    },
    [canSubmitAnswer, onSubmitAnswer]
  );

  return (
    <div className="flex h-dvh min-h-dvh w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_#fff8f2,_#ffffff_50%,_#f7fafc)] text-im-text-main">
      {/* Minimal Header */}
      <header className="sticky top-0 z-20 flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-im-primary text-xs font-extrabold text-white">
            IM
          </div>
          <span className="truncate text-base font-black tracking-tight text-im-text-main">Interview Room</span>
          <span className="hidden items-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 sm:inline-flex">
            {jobRoleLabel}
          </span>
          <span className="hidden max-w-[260px] items-center truncate rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 md:inline-flex">
            {stackLabel}
          </span>
          <span className="hidden items-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 lg:inline-flex">
            {difficultyLabel}
          </span>
        </div>

        <Button
          variant="ghost"
          onClick={onExit}
          disabled={!canExit}
          className="rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600"
        >
          {isExiting ? "리포트 불러오는 중..." : "나가기"}
        </Button>
      </header>

      {/* Main Content: 2-Column Split */}
      <main className="flex min-h-0 flex-1 gap-4 p-4 sm:gap-5 sm:p-5">
        {/* Left Column: Avatar (large) */}
        <section className="relative hidden min-h-0 w-[42%] shrink-0 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm lg:block">
          <div className="absolute inset-0">
            <InterviewerAvatarAnimated
              character={character}
              state={avatarState}
              cueToken={avatarCueToken}
              emotion={emotion}
              audioRef={audioRef}
              reactionEnabled={reactionEnabled}
            />
          </div>

        </section>

        {/* Right Column: Chat + Input */}
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
          {/* Question Banner */}
          <div className="shrink-0 border-b border-slate-200/70 bg-gradient-to-r from-im-primary-soft via-white to-im-subtle px-5 py-4">
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
              {streamingQuestionText || "질문을 불러오는 중입니다..."}
              {isQuestionStreaming ? <span className="sse-caret" /> : null}
            </p>
            {isResumeResolving ? (
              <p className="mt-2 text-xs font-medium text-im-text-muted">이전 세션 복구 중입니다...</p>
            ) : null}
          </div>

          {/* Chat History */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/40 px-5 py-4">
            <ChatBoard messages={visibleMessages} />
          </div>

          {/* Input Area */}
          <footer className="shrink-0 border-t border-slate-200/70 bg-white/95 px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
            <Textarea
              value={answerText}
              onChange={(event) => onChangeAnswer(event.target.value)}
              disabled={isBusy}
              onFocus={handleFocusAnswer}
              onKeyDown={handleAnswerKeyDown}
              aria-label="면접 답변 입력"
              placeholder="답변을 입력하세요..."
              className="min-h-[80px] max-h-[22dvh] resize-none rounded-2xl border-slate-200 sm:min-h-[100px] sm:max-h-[32vh]"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant={isRecording ? "primary" : "secondary"}
                onClick={onToggleRecording}
                disabled={!isRecording && isSttBusy}
                className="shrink-0 rounded-xl"
              >
                {isRecording ? <MicOff className="mr-1.5 h-4 w-4" /> : <Mic className="mr-1.5 h-4 w-4" />}
                {isRecording ? "녹음 종료" : "음성 답변"}
              </Button>
              <div className="flex-1" />
              <Button onClick={onSubmitAnswer} disabled={!canSubmitAnswer} className="min-w-[120px] rounded-xl">
                {isSubmitting ? "제출 중..." : "답변 완료"}
              </Button>
            </div>
          </footer>
        </section>
      </main>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
