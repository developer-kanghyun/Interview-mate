import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select
      className={`w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-900 shadow-soft outline-none backdrop-blur-xl transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
