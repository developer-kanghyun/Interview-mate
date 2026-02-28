"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getGoogleAuthUrl, getGuestAccess, getMyProfile } from "@/shared/api/interview";
import {
  clearPostLoginRedirectTarget,
  clearStoredSessionId,
  getAuthRequiredMessage,
  setPostLoginRedirectTarget
} from "@/shared/auth/session";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

type AuthPromptReason = "auth_required" | null;
type AuthStatus = "loading" | "member" | "guest" | "anonymous" | "error";

type UseInterviewAuthStateOptions = {
  step: InterviewStep;
  sessionId: string | null;
  showToastError: (message: string, dedupeKey?: string) => void;
  setUiError: (message: string | null) => void;
  onSyncResumeCandidate: (isGuestCandidate: boolean) => Promise<void>;
  onResetResumeState: () => void;
};

type UseInterviewAuthStateResult = {
  authStatus: AuthStatus;
  authPromptReason: AuthPromptReason;
  isAuthLoading: boolean;
  isGuestUser: boolean;
  isMemberAuthenticated: boolean;
  isAuthRequired: boolean;
  authRedirectTarget: string;
  setAuthPromptReason: (next: AuthPromptReason) => void;
  handleGoogleLogin: (redirectTo?: string) => Promise<void>;
  handleGoogleLogout: () => Promise<void>;
  retryAuthBootstrap: () => Promise<boolean>;
};

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

export function useInterviewAuthState({
  step,
  sessionId,
  showToastError,
  setUiError,
  onSyncResumeCandidate,
  onResetResumeState
}: UseInterviewAuthStateOptions): UseInterviewAuthStateResult {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [authPromptReason, setAuthPromptReason] = useState<AuthPromptReason>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isGuestUser, setIsGuestUser] = useState(false);

  const authRedirectTarget = useMemo(() => {
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
  }, [sessionId, step]);

  const handleGoogleLogin = useCallback(
    async (redirectTo?: string) => {
      if (isAuthLoading) {
        return;
      }
      if (redirectTo) {
        setPostLoginRedirectTarget(redirectTo);
      } else {
        clearPostLoginRedirectTarget();
      }

      setIsAuthLoading(true);

      try {
        const response = await getGoogleAuthUrl();
        window.location.assign(response.data.auth_url);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Google 로그인 URL 조회에 실패했습니다.";
        if (message.includes("Google OAuth Client ID")) {
          showToastError("Google 로그인 설정이 올바르지 않습니다. 서버 OAuth 환경변수를 확인해 주세요.", "auth:oauth");
        } else {
          showToastError(message, "auth:google-login-url");
        }
      } finally {
        setIsAuthLoading(false);
      }
    },
    [isAuthLoading, showToastError]
  );

  const handleGoogleLogout = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }
    setIsAuthLoading(true);
    try {
      clearStoredSessionId();
      onResetResumeState();
      window.location.assign("/api/v1/users/logout");
    } catch (error) {
      const message = error instanceof Error ? error.message : "로그아웃에 실패했습니다.";
      showToastError(message, "auth:logout");
      setIsAuthLoading(false);
    }
  }, [isAuthLoading, onResetResumeState, showToastError]);

  const bootstrapAuth = useCallback(
    async (isActive: () => boolean, showErrorToast: boolean) => {
      setAuthStatus("loading");

      for (let attempt = 0; attempt < AUTH_BOOTSTRAP_MAX_ATTEMPTS; attempt += 1) {
        if (!isActive()) {
          return false;
        }

        let profileMessage: string | null = null;

        try {
          const profile = await getMyProfile();
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
            await getGuestAccess();
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
    },
    [onSyncResumeCandidate, setUiError, showToastError]
  );

  useEffect(() => {
    let active = true;

    // 초기 진입 자동 부트스트랩은 조용히 수행하고, 실패 메시지는 사용자 액션 시에만 노출한다.
    void bootstrapAuth(() => active, false);

    return () => {
      active = false;
    };
  }, [bootstrapAuth]);

  const retryAuthBootstrap = useCallback(async () => {
    return bootstrapAuth(() => true, true);
  }, [bootstrapAuth]);

  return {
    authStatus,
    authPromptReason,
    isAuthLoading,
    isGuestUser,
    isMemberAuthenticated: authStatus === "member",
    isAuthRequired: authPromptReason === "auth_required",
    authRedirectTarget,
    setAuthPromptReason,
    handleGoogleLogin,
    handleGoogleLogout,
    retryAuthBootstrap
  };
}
