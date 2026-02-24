"use client";

import dynamic from "next/dynamic";
import { useCallback, type FocusEvent, type KeyboardEvent, type RefObject } from "react";
import { ChatBoard, type ChatMessage } from "@/shared/chat/ChatBoard";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { InlineNotice } from "@/shared/ui/InlineNotice";
import { Textarea } from "@/shared/ui/Textarea";
import type { InterviewCharacter, InterviewEmotion } from "@/shared/api/interview-client";
import type { AvatarState } from "@/entities/avatar/ui/InterviewerAvatarAnimated";

const InterviewerAvatarAnimated = dynamic(
  () => import("@/entities/avatar/ui/InterviewerAvatarAnimated").then((module) => module.InterviewerAvatarAnimated),
  { ssr: false }
);

type RoomViewProps = {
  interviewerName: string;
  sessionId: string;
  character: InterviewCharacter;
  avatarState: AvatarState;
  emotion: InterviewEmotion;
  audioRef: RefObject<HTMLAudioElement>;
  isAutoplayBlocked: boolean;
  playTtsAudio: () => void;
  ttsNotice: string | null;
  onDismissTtsNotice: () => void;
  isRecording: boolean;
  isSttSupported: boolean;
  isSttBusy: boolean;
  sttNotice: string | null;
  onDismissSttNotice: () => void;
  onToggleRecording: () => void;
  reactionEnabled: boolean;
  jobRoleLabel: string;
  stackLabel: string;
  difficultyLabel: string;
  questionOrder: number;
  totalQuestions: number;
  followupCount: number;
  streamingQuestionText: string;
  isQuestionStreaming: boolean;
  messages: ChatMessage[];
  answerText: string;
  onChangeAnswer: (value: string) => void;
  isSubmitting: boolean;
  onSubmitAnswer: () => void;
  onPause: () => void;
  isExiting: boolean;
  onExit: () => void;
};

export function RoomView({
  interviewerName,
  sessionId,
  character,
  avatarState,
  emotion,
  audioRef,
  isAutoplayBlocked,
  playTtsAudio,
  ttsNotice,
  onDismissTtsNotice,
  isRecording,
  isSttSupported,
  isSttBusy,
  sttNotice,
  onDismissSttNotice,
  onToggleRecording,
  reactionEnabled,
  jobRoleLabel,
  stackLabel,
  difficultyLabel,
  questionOrder,
  totalQuestions,
  followupCount,
  streamingQuestionText,
  isQuestionStreaming,
  messages,
  answerText,
  onChangeAnswer,
  isSubmitting,
  onSubmitAnswer,
  onPause,
  isExiting,
  onExit
}: RoomViewProps) {
  const visibleMessages = messages.filter((message) => message.role !== "interviewer");
  const isBusy = isExiting || isSubmitting;
  const canExit = !isBusy;
  const canSubmitAnswer = !isBusy && !isQuestionStreaming && answerText.trim().length > 0;
  const canPause = !isBusy && !isQuestionStreaming;
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
    <div className="flex h-dvh min-h-dvh w-full flex-col overflow-hidden bg-white text-im-text-main">
      {/* Minimal Header */}
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-im-border bg-white px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-im-primary text-[10px] font-extrabold text-white">
            IM
          </div>
          <span className="text-sm font-bold text-im-text-main">Interview Room</span>
          <Chip variant="info" className="text-[10px]">
            Q{questionOrder}/{totalQuestions}
          </Chip>
        </div>

        <Button
          variant="ghost"
          onClick={onExit}
          disabled={!canExit}
          className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
        >
          {isExiting ? "리포트 불러오는 중..." : "나가기"}
        </Button>
      </header>

      {/* Main Content: 2-Column Split */}
      <main className="flex min-h-0 flex-1">
        {/* Left Column: Avatar (large) */}
        <section className="relative hidden w-[45%] shrink-0 border-r border-im-border bg-im-subtle lg:block">
          <div className="absolute inset-0">
            <InterviewerAvatarAnimated
              character={character}
              state={avatarState}
              emotion={emotion}
              audioRef={audioRef}
              reactionEnabled={reactionEnabled}
            />
          </div>

          {/* Interviewer Name Badge */}
          <div className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 rounded-full border border-im-border bg-white/90 px-3 py-1.5 text-xs font-semibold text-im-text-main shadow-soft backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {interviewerName}
          </div>
        </section>

        {/* Right Column: Chat + Input */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* Current Question Banner */}
          <div className="shrink-0 border-b border-im-border bg-im-primary-soft/70 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-im-primary">
                  Current Question
                </p>
                <Chip variant="info" className="text-[10px]">Q{questionOrder}</Chip>
              </div>
              {isAutoplayBlocked ? (
                <Button 
                  variant="secondary" 
                  onClick={playTtsAudio} 
                  className="h-7 border-rose-200 bg-rose-50 px-3 text-xs text-rose-600 hover:bg-rose-100 hover:text-rose-700"
                >
                  🔊 질문 듣기
                </Button>
              ) : null}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-im-text-main">
              {streamingQuestionText || "질문을 불러오는 중입니다..."}
              {isQuestionStreaming ? <span className="sse-caret" /> : null}
            </p>
          </div>

          {/* Chat History */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            <ChatBoard messages={visibleMessages} />
          </div>

          {/* Input Area */}
          <footer className="shrink-0 border-t border-im-border bg-white px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
            <Textarea
              value={answerText}
              onChange={(event) => onChangeAnswer(event.target.value)}
              disabled={isBusy}
              onFocus={handleFocusAnswer}
              onKeyDown={handleAnswerKeyDown}
              placeholder="답변을 입력하세요..."
              className="min-h-[80px] max-h-[22dvh] resize-none sm:min-h-[100px] sm:max-h-[32vh]"
            />

            <div className="mt-3 flex items-center gap-2">
              <Button variant="secondary" onClick={onPause} disabled={!canPause} className="shrink-0">
                일시정지
              </Button>
              <Button
                variant={isRecording ? "primary" : "secondary"}
                onClick={onToggleRecording}
                disabled={!isRecording && isSttBusy}
                className="shrink-0"
              >
                {isRecording ? "⏹ 음성 중지" : "🎤 음성 답변"}
              </Button>
              <div className="flex-1" />
              <Button onClick={onSubmitAnswer} disabled={!canSubmitAnswer} className="min-w-[120px]">
                {isSubmitting ? "제출 중..." : "답변 완료"}
              </Button>
            </div>
          </footer>
        </section>
      </main>

      {ttsNotice ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
          <InlineNotice
            variant="info"
            className="pointer-events-auto max-w-xl border-im-primary/30 shadow-soft"
            message={ttsNotice}
            actions={
              <Button variant="secondary" className="h-7 px-3 text-xs" onClick={onDismissTtsNotice}>
                닫기
              </Button>
            }
          />
        </div>
      ) : null}

      {sttNotice ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-4">
          <InlineNotice
            variant={isSttSupported ? "warning" : "info"}
            className="pointer-events-auto max-w-xl shadow-soft"
            message={sttNotice}
            actions={
              <Button variant="secondary" className="h-7 px-3 text-xs" onClick={onDismissSttNotice}>
                닫기
              </Button>
            }
          />
        </div>
      ) : null}

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
