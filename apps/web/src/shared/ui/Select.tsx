import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select
      className={`w-full rounded-2xl border border-im-border bg-white px-4 py-3 text-sm text-im-text-main outline-none transition focus:border-im-primary focus:ring-4 focus:ring-im-primary/20 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
