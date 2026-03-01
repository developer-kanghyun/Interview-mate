"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getGoogleAuthUrl } from "@/shared/api/interview";
import {
  clearPostLoginRedirectTarget,
  clearStoredSessionId,
  setPostLoginRedirectTarget
} from "@/shared/auth/session";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";
import {
  bootstrapInterviewAuth,
  resolveAuthRedirectTarget,
  type AuthPromptReason,
  type AuthStatus
} from "@/features/interview-session/model/interviewAuth.bootstrap";

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
    return resolveAuthRedirectTarget(step, sessionId);
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
      return bootstrapInterviewAuth({
        isActive,
        showErrorToast,
        setAuthStatus,
        setIsGuestUser,
        setAuthPromptReason,
        setUiError,
        showToastError,
        onSyncResumeCandidate
      });
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
