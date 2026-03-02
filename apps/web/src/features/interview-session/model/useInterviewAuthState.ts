"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchInterviewGoogleAuthUrlUseCase } from "@/features/interview-session/model/application/interviewSessionUseCases";
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
  const [authStatus, setAuthStatus] = useState<AuthStatus>("anonymous");
  const [authPromptReason, setAuthPromptReason] = useState<AuthPromptReason>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isGuestUser, setIsGuestUser] = useState(false);
  const manualBootstrapInFlightRef = useRef<Promise<boolean> | null>(null);

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
        const response = await fetchInterviewGoogleAuthUrlUseCase();
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
    async ({
      isActive,
      showErrorToast,
      allowGuestIssue,
      showLoading
    }: {
      isActive: () => boolean;
      showErrorToast: boolean;
      allowGuestIssue: boolean;
      showLoading: boolean;
    }) => {
      if (showLoading && manualBootstrapInFlightRef.current) {
        return manualBootstrapInFlightRef.current;
      }

      const bootstrapPromise = (async () => {
        if (showLoading) {
          setIsAuthLoading(true);
        }
        try {
          return await bootstrapInterviewAuth({
            isActive,
            showErrorToast,
            allowGuestIssue,
            setLoadingState: showLoading,
            setAuthStatus,
            setIsGuestUser,
            setAuthPromptReason,
            setUiError,
            showToastError,
            onSyncResumeCandidate
          });
        } finally {
          if (showLoading) {
            setIsAuthLoading(false);
          }
        }
      })();

      if (showLoading) {
        manualBootstrapInFlightRef.current = bootstrapPromise;
      }
      try {
        return await bootstrapPromise;
      } finally {
        if (showLoading && manualBootstrapInFlightRef.current === bootstrapPromise) {
          manualBootstrapInFlightRef.current = null;
        }
      }
    },
    [onSyncResumeCandidate, setUiError, showToastError]
  );

  useEffect(() => {
    let active = true;

    // 초기 진입은 멤버 상태 확인만 조용히 수행한다(guest 발급/로딩 잠금 없음).
    void bootstrapAuth({
      isActive: () => active,
      showErrorToast: false,
      allowGuestIssue: false,
      showLoading: false
    });

    return () => {
      active = false;
    };
  }, [bootstrapAuth]);

  const retryAuthBootstrap = useCallback(async () => {
    return bootstrapAuth({
      isActive: () => true,
      showErrorToast: true,
      allowGuestIssue: true,
      showLoading: true
    });
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
