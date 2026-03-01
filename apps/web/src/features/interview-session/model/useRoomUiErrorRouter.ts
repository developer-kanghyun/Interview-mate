"use client";

import { useCallback, useEffect, useRef, type SetStateAction } from "react";
import { getAuthRequiredMessage } from "@/shared/auth/session";

type UseRoomUiErrorRouterOptions = {
  uiError: string | null;
  setUiError: (next: SetStateAction<string | null>) => void;
  setAuthPromptReason: (next: "auth_required" | null) => void;
  showToastError: (message: string, dedupeKey?: string) => void;
};

export function useRoomUiErrorRouter({
  uiError,
  setUiError,
  setAuthPromptReason,
  showToastError
}: UseRoomUiErrorRouterOptions) {
  const uiErrorRef = useRef<string | null>(null);

  useEffect(() => {
    uiErrorRef.current = uiError;
  }, [uiError]);

  return useCallback(
    (next: SetStateAction<string | null>) => {
      const resolved = typeof next === "function" ? next(uiErrorRef.current) : next;
      if (!resolved) {
        setUiError(null);
        setAuthPromptReason(null);
        return;
      }
      if (resolved === getAuthRequiredMessage()) {
        setAuthPromptReason("auth_required");
        setUiError(resolved);
        return;
      }
      setAuthPromptReason(null);
      showToastError(resolved, `ui:${resolved}`);
    },
    [setAuthPromptReason, setUiError, showToastError]
  );
}
