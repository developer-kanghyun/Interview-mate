"use client";

import {
  fetchInterviewMyProfileUseCase,
  issueInterviewGuestAccessUseCase
} from "@/features/interview-session/model/application/interviewSessionUseCases";
import { getAuthRequiredMessage } from "@/shared/auth/session";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

export type AuthPromptReason = "auth_required" | null;
export type AuthStatus = "loading" | "member" | "guest" | "anonymous" | "error";

const AUTH_BOOTSTRAP_MAX_ATTEMPTS = 2;
const AUTH_BOOTSTRAP_RETRY_DELAY_MS = 1_000;

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function resolveAuthBootstrapErrorMessage(profileMessage: string | null, guestMessage: string) {
  if (profileMessage === getAuthRequiredMessage()) {
    return guestMessage;
  }
  return guestMessage || profileMessage || "인증 상태 확인에 실패했습니다.";
}

type BootstrapInterviewAuthOptions = {
  isActive: () => boolean;
  showErrorToast: boolean;
  setAuthStatus: (next: AuthStatus) => void;
  setIsGuestUser: (next: boolean) => void;
  setAuthPromptReason: (next: AuthPromptReason) => void;
  setUiError: (next: string | null) => void;
  showToastError: (message: string, dedupeKey?: string) => void;
  onSyncResumeCandidate: (isGuestCandidate: boolean) => Promise<void>;
};

export async function bootstrapInterviewAuth({
  isActive,
  showErrorToast,
  setAuthStatus,
  setIsGuestUser,
  setAuthPromptReason,
  setUiError,
  showToastError,
  onSyncResumeCandidate
}: BootstrapInterviewAuthOptions) {
  setAuthStatus("loading");

  for (let attempt = 0; attempt < AUTH_BOOTSTRAP_MAX_ATTEMPTS; attempt += 1) {
    if (!isActive()) {
      return false;
    }

    let profileMessage: string | null = null;

    try {
      const profile = await fetchInterviewMyProfileUseCase();
      if (!isActive()) {
        return false;
      }
      const guest = !profile.data.email;
      setAuthStatus(guest ? "guest" : "member");
      setIsGuestUser(guest);
      setAuthPromptReason(null);
      await onSyncResumeCandidate(guest);
      return true;
    } catch (error) {
      if (!isActive()) {
        return false;
      }

      profileMessage = error instanceof Error ? error.message : "로그인 상태 확인에 실패했습니다.";
      const isAuthRequired = profileMessage === getAuthRequiredMessage();

      if (!isAuthRequired) {
        const isLastAttempt = attempt >= AUTH_BOOTSTRAP_MAX_ATTEMPTS - 1;
        if (!isLastAttempt) {
          await sleep(AUTH_BOOTSTRAP_RETRY_DELAY_MS);
          continue;
        }

        if (showErrorToast) {
          showToastError(profileMessage, "auth:profile");
        }
        setAuthStatus("error");
        setAuthPromptReason(null);
        setIsGuestUser(false);
        return false;
      }

      try {
        await issueInterviewGuestAccessUseCase();
        if (!isActive()) {
          return false;
        }
        setAuthStatus("guest");
        setIsGuestUser(true);
        setAuthPromptReason(null);
        await onSyncResumeCandidate(true);
        return true;
      } catch (guestError) {
        if (!isActive()) {
          return false;
        }
        const guestMessage =
          guestError instanceof Error ? guestError.message : "게스트 인증 발급에 실패했습니다.";
        if (guestMessage === getAuthRequiredMessage()) {
          setUiError(guestMessage);
          setAuthStatus("anonymous");
          setAuthPromptReason("auth_required");
          setIsGuestUser(false);
          return false;
        }

        const isLastAttempt = attempt >= AUTH_BOOTSTRAP_MAX_ATTEMPTS - 1;
        if (!isLastAttempt) {
          await sleep(AUTH_BOOTSTRAP_RETRY_DELAY_MS);
          continue;
        }

        if (showErrorToast) {
          showToastError(resolveAuthBootstrapErrorMessage(profileMessage, guestMessage), "auth:guest-access");
        }
        setAuthStatus("error");
        setAuthPromptReason(null);
        setIsGuestUser(false);
        return false;
      }
    }
  }

  return false;
}

export function resolveAuthRedirectTarget(step: InterviewStep, sessionId: string | null) {
  if (step === "report" && sessionId) {
    return `/report/${sessionId}`;
  }
  if (step === "room" && sessionId) {
    return `/interview/${sessionId}`;
  }
  if (step === "insights") {
    return "/study";
  }
  if (step === "setup") {
    return "/setup";
  }
  return "/interview";
}
