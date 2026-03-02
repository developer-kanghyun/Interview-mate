"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, type FocusEvent, type KeyboardEvent, type RefObject } from "react";
import { ChatBoard, type ChatMessage } from "@/shared/chat/ChatBoard";
import { RoomAnswerFooter } from "@/widgets/interview-room/ui/RoomAnswerFooter";
import { RoomHeader } from "@/widgets/interview-room/ui/RoomHeader";
import { RoomQuestionBanner } from "@/widgets/interview-room/ui/RoomQuestionBanner";
import { Button } from "@/shared/ui/Button";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";

import type { InterviewCharacter, InterviewEmotion } from "@/shared/api/interview-client";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";

const InterviewerAvatarAnimated = dynamic(
  () => import("@/entities/avatar/ui/InterviewerAvatarAnimated").then((module) => module.InterviewerAvatarAnimated),
  { ssr: false }
);

const AVATAR_LOAD_TIMEOUT_MS = 8_000;

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
  followupCount: number;
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
  followupCount,
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
  const [avatarLoadState, setAvatarLoadState] = useState<"loading" | "ready" | "fallback">("loading");
  const [avatarRenderKey, setAvatarRenderKey] = useState(0);

  useEffect(() => {
    setAvatarLoadState("loading");
    setAvatarRenderKey((previous) => previous + 1);
  }, [character]);

  useEffect(() => {
    if (avatarLoadState !== "loading") {
      return;
    }

    const timer = window.setTimeout(() => {
      setAvatarLoadState("fallback");
    }, AVATAR_LOAD_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [avatarLoadState, avatarRenderKey]);

  const handleAvatarReady = useCallback(() => {
    setAvatarLoadState((current) => (current === "loading" ? "ready" : current));
  }, []);

  const handleAvatarError = useCallback(() => {
    setAvatarLoadState("fallback");
  }, []);

  const handleRetryAvatarLoad = useCallback(() => {
    setAvatarLoadState("loading");
    setAvatarRenderKey((previous) => previous + 1);
  }, []);

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
    <div className="relative flex h-dvh min-h-dvh w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_#fff8f2,_#ffffff_50%,_#f7fafc)] text-im-text-main">
      {avatarLoadState === "loading" ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/92">
          <div className="flex flex-col items-center gap-3 text-im-text-muted">
            <LoadingSpinner size="lg" tone="primary" label="아바타를 불러오는 중입니다." />
            <p className="text-sm font-semibold">면접관 아바타를 준비하고 있어요...</p>
          </div>
        </div>
      ) : null}

      <RoomHeader
        jobRoleLabel={jobRoleLabel}
        stackLabel={stackLabel}
        difficultyLabel={difficultyLabel}
        canExit={canExit}
        isExiting={isExiting}
        onExit={onExit}
      />

      {/* Main Content: 2-Column Split */}
      <main
        className={`flex min-h-0 flex-1 gap-4 p-4 transition-opacity duration-200 sm:gap-5 sm:p-5 ${
          avatarLoadState === "loading" ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        {/* Left Column: Avatar (large) */}
        <section className="relative hidden min-h-0 w-[42%] shrink-0 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm lg:block">
          <div className="absolute inset-0">
            <InterviewerAvatarAnimated
              key={`${character}:${avatarRenderKey}`}
              character={character}
              state={avatarState}
              cueToken={avatarCueToken}
              emotion={emotion}
              audioRef={audioRef}
              reactionEnabled={reactionEnabled}
              onReady={handleAvatarReady}
              onError={handleAvatarError}
              forceFallback={avatarLoadState === "fallback"}
            />
          </div>
          {avatarLoadState === "fallback" ? (
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
              <Button variant="secondary" size="sm" onClick={handleRetryAvatarLoad}>
                아바타 다시 불러오기
              </Button>
            </div>
          ) : null}
        </section>

        {/* Right Column: Chat + Input */}
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
          <RoomQuestionBanner
            isAutoplayBlocked={isAutoplayBlocked}
            playTtsAudio={playTtsAudio}
            questionOrder={questionOrder}
            totalQuestions={totalQuestions}
            followupCount={followupCount}
            streamingQuestionText={streamingQuestionText}
            isQuestionStreaming={isQuestionStreaming}
            isResumeResolving={isResumeResolving}
          />

          {/* Chat History */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/40 px-5 py-4">
            <ChatBoard messages={visibleMessages} />
          </div>

          <RoomAnswerFooter
            answerText={answerText}
            onChangeAnswer={onChangeAnswer}
            isBusy={isBusy}
            handleFocusAnswer={handleFocusAnswer}
            handleAnswerKeyDown={handleAnswerKeyDown}
            isRecording={isRecording}
            isSttBusy={isSttBusy}
            onToggleRecording={onToggleRecording}
            onSubmitAnswer={onSubmitAnswer}
            canSubmitAnswer={canSubmitAnswer}
            isSubmitting={isSubmitting}
          />
        </section>
      </main>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
