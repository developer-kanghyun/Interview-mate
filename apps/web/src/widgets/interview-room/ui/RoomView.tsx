"use client";

import dynamic from "next/dynamic";
import type { RefObject } from "react";
import { ChatBoard, type ChatMessage } from "@/shared/chat/ChatBoard";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
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

function toEmotionLabel(emotion: InterviewEmotion) {
  if (emotion === "encourage") {
    return "격려";
  }
  if (emotion === "pressure") {
    return "압박";
  }
  return "중립";
}

function toEmotionVariant(emotion: InterviewEmotion): "default" | "success" | "danger" {
  if (emotion === "encourage") {
    return "success";
  }
  if (emotion === "pressure") {
    return "danger";
  }
  return "default";
}

export function RoomView({
  interviewerName,
  sessionId,
  character,
  avatarState,
  emotion,
  audioRef,
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
  const canSubmitAnswer = !isBusy && !isQuestionStreaming && answerText.trim().length > 0;
  const canPause = !isBusy && !isQuestionStreaming;

  return (
    <div className="flex h-dvh min-h-dvh w-full flex-col overflow-hidden text-slate-900">
      <header className="sticky top-0 z-20 h-16 shrink-0 border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-sm font-extrabold text-white shadow-soft">
              IM
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">Interview Room</p>
              <p className="text-[11px] text-slate-500">실전 모의면접 진행 중</p>
            </div>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-600">
              LIVE
            </span>
          </div>

          <Button
            variant="secondary"
            onClick={onExit}
            disabled={isExiting}
            className="border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 focus-visible:ring-rose-200"
          >
            {isExiting ? "리포트 불러오는 중..." : "면접 종료"}
          </Button>
        </div>
      </header>

      <main className="min-h-0 flex-1 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:px-6 md:pb-6">
        <div className="mx-auto grid h-full min-h-0 w-full max-w-6xl grid-rows-[minmax(280px,46vh)_minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_440px] lg:grid-rows-1">
          <section className="relative min-h-0 overflow-hidden rounded-3xl border border-white/70 bg-white/60 shadow-glass backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100 via-white/40 to-indigo-100/40" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent" />

            <div className="absolute inset-0">
              <InterviewerAvatarAnimated
                character={character}
                state={avatarState}
                emotion={emotion}
                audioRef={audioRef}
                reactionEnabled={reactionEnabled}
              />
            </div>

            <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-3 py-1 text-xs font-semibold text-slate-700 shadow-soft backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {interviewerName}
            </div>

            <div className="absolute bottom-4 left-1/2 z-10 w-[min(92%,360px)] -translate-x-1/2 rounded-2xl border border-white/80 bg-white/75 p-3 text-center shadow-soft backdrop-blur-xl">
              <p className="text-xs font-semibold text-slate-600">{isQuestionStreaming ? "질문 중..." : "듣고 있습니다..."}</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="h-2 w-2 animate-wave rounded-full bg-blue-500" />
                <span className="h-2 w-2 animate-wave rounded-full bg-blue-500 [animation-delay:180ms]" />
                <span className="h-2 w-2 animate-wave rounded-full bg-blue-500 [animation-delay:360ms]" />
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/75 shadow-glass backdrop-blur-xl">
            <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 px-5 py-4 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{interviewerName}</p>
                    <p className="text-xs text-slate-600">{jobRoleLabel} · {stackLabel} · {difficultyLabel}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip className="border-slate-200 bg-slate-50 text-slate-700">세션 {sessionId.slice(0, 12)}</Chip>
                    <Chip variant="info">캐릭터 {character.toUpperCase()}</Chip>
                    <Chip variant="info">
                      {questionOrder}/{totalQuestions}
                    </Chip>
                    <Chip variant={toEmotionVariant(emotion)}>{toEmotionLabel(emotion)}</Chip>
                    <Chip variant="default">FU {followupCount}/2</Chip>
                  </div>
                </div>
                <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-400">
                  webcam
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/60 px-5 py-4">
              <section className="mb-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Current Question</p>
                  <Chip variant="info" className="text-[10px]">
                    Q{questionOrder}
                  </Chip>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                  {streamingQuestionText || "질문을 불러오는 중입니다..."}
                </p>
              </section>

              <ChatBoard messages={visibleMessages} />
            </div>

            <footer className="shrink-0 border-t border-slate-200/80 bg-white/85 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
              <Textarea
                value={answerText}
                onChange={(event) => onChangeAnswer(event.target.value)}
                disabled={isBusy}
                placeholder="답변을 입력하세요. (텍스트/음성 STT 연동 예정)"
                className="min-h-[96px] max-h-[28dvh] resize-none border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:ring-blue-100 sm:min-h-[120px] sm:max-h-[32vh]"
              />

              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  disabled
                  className="h-10 w-10 rounded-full p-0 text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-200"
                >
                  ◀
                </Button>
                <Button variant="secondary" onClick={onPause} disabled={!canPause} className="border-slate-200">
                  일시정지
                </Button>
                <Button onClick={onSubmitAnswer} disabled={!canSubmitAnswer} className="flex-1">
                  {isSubmitting ? "답변 제출 중..." : "답변 완료"}
                </Button>
                <Button
                  variant="ghost"
                  disabled
                  className="h-10 w-10 rounded-full p-0 text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-200"
                >
                  ▶
                </Button>
              </div>
            </footer>
          </aside>
        </div>
      </main>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
