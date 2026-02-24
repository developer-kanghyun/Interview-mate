import type { HTMLAttributes } from "react";

type ChipVariant = "default" | "success" | "danger" | "info";

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: ChipVariant;
};

const variantClassMap: Record<ChipVariant, string> = {
  default: "border-im-border bg-im-subtle text-im-text-muted",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-im-primary/20 bg-im-primary-soft text-im-primary"
};

export function Chip({ variant = "default", className = "", children, ...props }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${variantClassMap[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
