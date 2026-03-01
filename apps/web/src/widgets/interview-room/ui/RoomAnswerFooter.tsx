"use client";

import { type FocusEvent, type KeyboardEvent } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";
import { Textarea } from "@/shared/ui/Textarea";

type RoomAnswerFooterProps = {
  answerText: string;
  onChangeAnswer: (value: string) => void;
  isBusy: boolean;
  handleFocusAnswer: (event: FocusEvent<HTMLTextAreaElement>) => void;
  handleAnswerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  isRecording: boolean;
  isSttBusy: boolean;
  onToggleRecording: () => void;
  onSubmitAnswer: () => void;
  canSubmitAnswer: boolean;
  isSubmitting: boolean;
};

export function RoomAnswerFooter({
  answerText,
  onChangeAnswer,
  isBusy,
  handleFocusAnswer,
  handleAnswerKeyDown,
  isRecording,
  isSttBusy,
  onToggleRecording,
  onSubmitAnswer,
  canSubmitAnswer,
  isSubmitting
}: RoomAnswerFooterProps) {
  return (
    <footer className="shrink-0 border-t border-slate-200/70 bg-white/95 px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
      <Textarea
        data-testid="room-answer-input"
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
          data-testid="room-voice-toggle"
          variant={isRecording ? "primary" : "secondary"}
          onClick={onToggleRecording}
          disabled={!isRecording && isSttBusy}
          className="shrink-0 rounded-xl"
        >
          {isRecording ? <MicOff className="mr-1.5 h-4 w-4" /> : <Mic className="mr-1.5 h-4 w-4" />}
          {isRecording ? "녹음 종료" : "음성 답변"}
        </Button>
        <div className="flex-1" />
        <Button
          data-testid="room-submit-answer"
          onClick={onSubmitAnswer}
          disabled={!canSubmitAnswer}
          className="min-w-[120px] gap-2 rounded-xl"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" tone="on-primary" />
              제출 중...
            </>
          ) : (
            "답변 완료"
          )}
        </Button>
      </div>
    </footer>
  );
}
