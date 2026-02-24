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
  info: "border-blue-200 bg-blue-50 text-blue-700"
};

export function InlineNotice({ message, variant = "info", actions, className = "" }: InlineNoticeProps) {
  return (
    <div
      className={`mx-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${variantClassNameMap[variant]} ${className}`}
    >
      <span>{message}</span>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
