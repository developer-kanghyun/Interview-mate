"use client";

import { useEffect } from "react";
import type { ShowToast } from "@/features/interview-session/model/interviewRoom.types";

type UseRoomSpeechErrorNoticeOptions = {
  speechError: string;
  isSttSupported: boolean;
  showToast: ShowToast;
  clearSpeechError: () => void;
};

export function useRoomSpeechErrorNotice({
  speechError,
  isSttSupported,
  showToast,
  clearSpeechError
}: UseRoomSpeechErrorNoticeOptions) {
  useEffect(() => {
    if (!speechError) {
      return;
    }

    if (!isSttSupported) {
      showToast({
        message: "이 브라우저는 음성 인식을 지원하지 않습니다. 텍스트로 답변해 주세요.",
        variant: "info",
        dedupeKey: "stt:not-supported"
      });
    } else {
      showToast({
        message: "음성 인식 실패 상태입니다. 버튼 눌러 다시 시도해 주세요.",
        variant: "warning",
        dedupeKey: "stt:recognition-failed"
      });
    }
    clearSpeechError();
  }, [clearSpeechError, isSttSupported, showToast, speechError]);
}
