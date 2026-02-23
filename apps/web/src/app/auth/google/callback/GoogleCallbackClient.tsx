"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeGoogleAuth } from "@/shared/api/interview";

type Props = {
  code: string | null;
  state: string | null;
  oauthError: string | null;
};

function resolveRedirectTarget() {
  if (typeof window === "undefined") {
    return "/interview";
  }

  const rawTarget = new URLSearchParams(window.location.search).get("redirectTo");
  if (!rawTarget) {
    return "/interview";
  }

  const trimmed = rawTarget.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/interview";
  }

  if (trimmed.startsWith("/auth/google/callback")) {
    return "/interview";
  }

  return trimmed;
}

export default function GoogleCallbackClient({ code, state, oauthError }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState(oauthError ? oauthError : "Google 로그인 처리 중...");

  useEffect(() => {
    let active = true;
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;

    async function run() {
      if (oauthError) {
        redirectTimer = setTimeout(() => {
          router.replace("/");
        }, 1200);
        return;
      }

      if (!code) {
        setMessage("인증 code가 없습니다. 다시 로그인해 주세요.");
        redirectTimer = setTimeout(() => {
          router.replace("/");
        }, 1200);
        return;
      }

      try {
        await completeGoogleAuth(code, state);
        if (!active) {
          return;
        }
        const redirectTarget = resolveRedirectTarget();
        setMessage("로그인 성공. 인터뷰 화면으로 이동합니다...");
        setTimeout(() => {
          router.replace(redirectTarget);
        }, 500);
      } catch (error) {
        if (!active) {
          return;
        }
        const errorMessage = error instanceof Error ? error.message : "Google 로그인 처리에 실패했습니다.";
        setMessage(errorMessage);
      }
    }

    run();
    return () => {
      active = false;
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [code, oauthError, state, router]);

  return (
    <main className="stack">
      <h1>Google 로그인</h1>
      <section className="card stack">
        <p>{message}</p>
      </section>
    </main>
  );
}
