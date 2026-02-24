import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-xl border border-im-border bg-white px-3 py-2 text-sm text-im-text-main shadow-soft outline-none transition placeholder:text-im-text-muted focus:border-im-primary focus:ring-4 focus:ring-im-primary/20 ${className}`}
      {...props}
    />
  );
}
