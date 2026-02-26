"use client";

import { createContext, useCallback, useMemo, useRef, useState, type PropsWithChildren } from "react";
import type { ToastItem, ToastOptions, ToastVariant } from "@/shared/ui/toast/toast.types";

type ToastContextValue = {
  pushToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

const MAX_TOAST_COUNT = 3;
const TOAST_DEDUPE_WINDOW_MS = 1500;

const variantClassNameMap: Record<ToastVariant, string> = {
  info: "border-im-primary/30 bg-im-primary-soft text-im-text-main",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-rose-200 bg-rose-50 text-rose-700"
};

function normalizeToast(options: ToastOptions): ToastItem {
  const variant = options.variant ?? "info";
  const durationMs =
    options.durationMs !== undefined ? options.durationMs : variant === "error" ? null : 5000;
  const dismissible = options.dismissible ?? true;

  return {
    id: options.id ?? `toast-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: options.title,
    message: options.message,
    variant,
    durationMs,
    dismissible,
    dedupeKey: options.dedupeKey
  };
}

export const ToastContext = createContext<ToastContextValue | null>(null);

function ToastCard({
  item,
  onDismiss
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      role={item.variant === "error" ? "alert" : "status"}
      aria-live={item.variant === "error" ? "assertive" : "polite"}
      data-testid="toast-item"
      className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-soft ${variantClassNameMap[item.variant]}`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {item.title ? <p className="text-sm font-bold">{item.title}</p> : null}
          <p className="text-sm leading-6">{item.message}</p>
        </div>
        {item.dismissible ? (
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            className="rounded-md px-2 py-1 text-xs font-semibold transition-colors hover:bg-black/5"
            aria-label="토스트 닫기"
          >
            닫기
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dedupeMapRef = useRef<Record<string, { at: number; id: string }>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const pushToast = useCallback((options: ToastOptions) => {
    const nextToast = normalizeToast(options);
    const now = Date.now();
    const dedupeKey = nextToast.dedupeKey;

    if (dedupeKey) {
      const recent = dedupeMapRef.current[dedupeKey];
      if (recent && now - recent.at <= TOAST_DEDUPE_WINDOW_MS) {
        return recent.id;
      }
      dedupeMapRef.current[dedupeKey] = { at: now, id: nextToast.id };
    }

    setToasts((current) => {
      const merged = [...current, nextToast];
      if (merged.length <= MAX_TOAST_COUNT) {
        return merged;
      }
      return merged.slice(merged.length - MAX_TOAST_COUNT);
    });

    if (nextToast.durationMs && nextToast.durationMs > 0) {
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== nextToast.id));
      }, nextToast.durationMs);
    }

    return nextToast.id;
  }, []);

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      pushToast,
      dismissToast,
      clearToasts
    }),
    [clearToasts, dismissToast, pushToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        data-testid="toast-region"
        className="pointer-events-none fixed inset-x-0 top-3 z-[60] mx-auto flex w-full max-w-[420px] flex-col gap-2 px-3 sm:right-4 sm:top-4 sm:left-auto sm:mx-0 sm:px-0"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} item={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
