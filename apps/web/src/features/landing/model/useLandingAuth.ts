"use client";

import { useCallback, useEffect, useState } from "react";
import { getGoogleAuthUrl, getMyProfile } from "@/shared/api/interview";
import { clearStoredSessionId } from "@/shared/auth/session";

export function useLandingAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((res) => {
        if (res.data.email) {
          setIsLoggedIn(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = useCallback(async () => {
    setIsLoginLoading(true);
    try {
      const res = await getGoogleAuthUrl();
      window.location.href = res.data.auth_url;
    } catch (error) {
      console.error(error);
      setIsLoginLoading(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("im_session_id");
      localStorage.removeItem("im_api_key");
      clearStoredSessionId();
    } catch {}
    window.location.reload();
  }, []);

  return {
    isLoggedIn,
    isLoginLoading,
    handleLogin,
    handleLogout
  };
}
