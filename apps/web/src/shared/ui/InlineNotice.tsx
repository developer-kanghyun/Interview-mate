import type { ReactNode } from "react";

type InlineNoticeVariant = "error" | "warning" | "info";

type InlineNoticeProps = {
  message: ReactNode;
  variant?: InlineNoticeVariant;
  actions?: ReactNode;
  className?: string;
};

const variantClassNameMap: Record<InlineNoticeVariant, string> = {
  error: "border-rose-200 bg-rose-50 text-rose-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-im-primary/20 bg-im-primary-soft text-im-primary"
};

export function InlineNotice({ message, variant = "info", actions, className = "" }: InlineNoticeProps) {
  return (
    <div
      className={`mx-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-2xl border px-5 py-3 text-sm ${variantClassNameMap[variant]} ${className}`}
    >
      <span>{message}</span>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
