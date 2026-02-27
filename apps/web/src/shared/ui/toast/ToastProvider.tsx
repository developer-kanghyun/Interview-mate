"use client";

import { createContext, useCallback, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import type { ToastItem, ToastOptions, ToastVariant } from "@/shared/ui/toast/toast.types";

type ToastContextValue = {
  pushToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

const MAX_TOAST_COUNT = 3;
const TOAST_DEDUPE_WINDOW_MS = 1500;

const variantClassNameMap: Record<ToastVariant, string> = {
  info: "border-im-border bg-white text-im-text-main",
  success: "border-emerald-200/80 bg-emerald-50/65 text-im-text-main",
  warning: "border-amber-200/80 bg-amber-50/70 text-im-text-main",
  error: "border-rose-200/80 bg-rose-50/75 text-im-text-main"
};

const variantIconClassNameMap: Record<ToastVariant, string> = {
  info: "text-sky-600",
  success: "text-emerald-600",
  warning: "text-amber-700",
  error: "text-rose-600"
};

const variantIconBackgroundClassNameMap: Record<ToastVariant, string> = {
  info: "bg-sky-50",
  success: "bg-emerald-50",
  warning: "bg-amber-50",
  error: "bg-rose-50"
};

const variantIconMap: Record<ToastVariant, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle
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
  const Icon = variantIconMap[item.variant];
  const iconClassName = variantIconClassNameMap[item.variant];
  const iconBackgroundClassName = variantIconBackgroundClassNameMap[item.variant];

  return (
    <div
      role={item.variant === "error" ? "alert" : "status"}
      aria-live={item.variant === "error" ? "assertive" : "polite"}
      data-testid="toast-item"
      className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.12)] animate-[toast-rise-up_220ms_cubic-bezier(0.16,1,0.3,1)] ${variantClassNameMap[item.variant]}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconBackgroundClassName}`}>
          <Icon className={`h-4 w-4 ${iconClassName}`} strokeWidth={2.6} />
        </div>
        <div className="min-w-0 flex-1">
          {item.title ? <p className="text-sm font-bold">{item.title}</p> : null}
          <p className="text-sm leading-6 text-im-text-main/80">{item.message}</p>
        </div>
        {item.dismissible ? (
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-im-text-muted transition-colors hover:bg-black/5 hover:text-im-text-main"
            aria-label="토스트 닫기"
          >
            <X className="h-4 w-4" />
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
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] mx-auto flex w-full max-w-[520px] flex-col gap-2 px-3 sm:bottom-6 sm:px-4"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} item={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
