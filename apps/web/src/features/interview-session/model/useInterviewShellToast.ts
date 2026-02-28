"use client";

import { useCallback, useEffect, useState } from "react";

type ToastVariant = "info" | "success" | "warning" | "error";

type ToastPayload = {
  message: string;
  variant?: ToastVariant;
  dedupeKey?: string;
  title?: string;
};

type PushToast = (payload: ToastPayload) => void;

export function useInterviewShellToast(pushToast: PushToast) {
  const [toastError, setToastError] = useState<{ message: string; dedupeKey?: string } | null>(null);

  const showToast = useCallback(
    (options: ToastPayload) => {
      pushToast({
        message: options.message,
        variant: options.variant,
        dedupeKey: options.dedupeKey,
        title: options.title
      });
    },
    [pushToast]
  );

  const showToastError = useCallback((message: string, dedupeKey?: string) => {
    setToastError({ message, dedupeKey });
  }, []);

  useEffect(() => {
    if (!toastError) {
      return;
    }

    showToast({
      message: toastError.message,
      variant: "error",
      dedupeKey: toastError.dedupeKey ?? `error:${toastError.message}`
    });
    setToastError(null);
  }, [showToast, toastError]);

  return {
    showToast,
    showToastError
  };
}
