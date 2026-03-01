"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchLatestActiveInterviewSessionUseCase } from "@/features/interview-session/model/application/interviewSessionUseCases";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

type UseInterviewResumeStateOptions = {
  routeSessionId: string | null;
  routeStep: InterviewStep | null;
  step: InterviewStep;
  showToastError: (message: string, dedupeKey?: string) => void;
};

type UseInterviewResumeStateResult = {
  resumeCandidateSessionId: string | null;
  isResumePromptOpen: boolean;
  isResumeCandidateGuest: boolean;
  isResumeResolving: boolean;
  setResumeCandidateSessionId: (next: string | null) => void;
  setIsResumePromptOpen: (next: boolean) => void;
  setIsResumeCandidateGuest: (next: boolean) => void;
  setIsResumeResolving: (next: boolean) => void;
  syncResumeCandidate: (isGuestCandidate: boolean) => Promise<void>;
  handleDismissResumeCandidate: () => void;
  resetResumeState: () => void;
};

export function useInterviewResumeState({
  routeSessionId,
  routeStep,
  step,
  showToastError
}: UseInterviewResumeStateOptions): UseInterviewResumeStateResult {
  const [resumeCandidateSessionId, setResumeCandidateSessionId] = useState<string | null>(null);
  const [isResumePromptOpen, setIsResumePromptOpen] = useState(false);
  const [isResumeCandidateGuest, setIsResumeCandidateGuest] = useState(false);
  const [isResumeResolving, setIsResumeResolving] = useState(false);

  const resetResumeState = useCallback(() => {
    setResumeCandidateSessionId(null);
    setIsResumeCandidateGuest(false);
    setIsResumePromptOpen(false);
  }, []);

  const syncResumeCandidate = useCallback(
    async (isGuestCandidate: boolean) => {
      if (routeSessionId || routeStep === "room") {
        return;
      }

      try {
        const latestActiveResponse = await fetchLatestActiveInterviewSessionUseCase();
        const latestActive = latestActiveResponse.data;
        const latestSession = latestActive.session;
        if (!latestActive.has_active_session) {
          return;
        }

        if (!latestSession || latestSession.status !== "in_progress" || !latestSession.current_question) {
          resetResumeState();
          showToastError("이전 세션은 재개할 수 없습니다. 새 면접을 시작해 주세요.", "resume:invalid");
          return;
        }

        setResumeCandidateSessionId(latestSession.session_id);
        setIsResumeCandidateGuest(isGuestCandidate);
      } catch {
        // latest-active 탐색 실패는 무시하고 일반 시작 흐름 유지
      }
    },
    [resetResumeState, routeSessionId, routeStep, showToastError]
  );

  const handleDismissResumeCandidate = useCallback(() => {
    resetResumeState();
  }, [resetResumeState]);

  useEffect(() => {
    if (!resumeCandidateSessionId) {
      return;
    }
    if (step !== "setup" || routeSessionId || isResumeResolving) {
      return;
    }
    setIsResumePromptOpen(true);
  }, [isResumeResolving, resumeCandidateSessionId, routeSessionId, step]);

  return {
    resumeCandidateSessionId,
    isResumePromptOpen,
    isResumeCandidateGuest,
    isResumeResolving,
    setResumeCandidateSessionId,
    setIsResumePromptOpen,
    setIsResumeCandidateGuest,
    setIsResumeResolving,
    syncResumeCandidate,
    handleDismissResumeCandidate,
    resetResumeState
  };
}
