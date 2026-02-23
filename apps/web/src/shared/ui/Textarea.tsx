import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm leading-6 text-slate-900 shadow-soft outline-none backdrop-blur-xl transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 ${className}`}
      {...props}
    />
  );
}
