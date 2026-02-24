import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full rounded-2xl border border-im-border bg-white px-4 py-3 text-sm leading-6 text-im-text-main outline-none transition placeholder:text-im-text-muted focus:border-im-primary focus:ring-4 focus:ring-im-primary/20 ${className}`}
      {...props}
    />
  );
}
