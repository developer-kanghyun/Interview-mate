import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-900 shadow-soft outline-none backdrop-blur-xl transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 ${className}`}
      {...props}
    />
  );
}
