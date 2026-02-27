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
};

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

  useEffect(() => {
    let active = true;
    setAuthStatus("loading");

    void (async () => {
      try {
        const profile = await getMyProfile();
        if (!active) {
          return;
        }
        const guest = !profile.data.email;
        setAuthStatus(guest ? "guest" : "member");
        setIsGuestUser(guest);
        setAuthPromptReason(null);
        await onSyncResumeCandidate(guest);
      } catch (error) {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : "로그인 상태 확인에 실패했습니다.";
        if (message !== getAuthRequiredMessage()) {
          setAuthStatus("error");
          setIsGuestUser(false);
          setAuthPromptReason(null);
          showToastError(message, "auth:profile");
          return;
        }

        try {
          await getGuestAccess();
          if (!active) {
            return;
          }
          setAuthStatus("guest");
          setIsGuestUser(true);
          setAuthPromptReason(null);
          await onSyncResumeCandidate(true);
        } catch (guestError) {
          if (!active) {
            return;
          }
          const guestMessage =
            guestError instanceof Error ? guestError.message : "게스트 인증 발급에 실패했습니다.";
          if (guestMessage === getAuthRequiredMessage()) {
            setUiError(guestMessage);
            setAuthStatus("anonymous");
            setAuthPromptReason("auth_required");
            setIsGuestUser(false);
          } else {
            showToastError(guestMessage, "auth:guest-access");
            setAuthStatus("error");
            setAuthPromptReason(null);
            setIsGuestUser(false);
          }
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [onSyncResumeCandidate, setUiError, showToastError]);

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
    handleGoogleLogout
  };
}
