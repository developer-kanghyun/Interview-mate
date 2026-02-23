import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClassMap: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white shadow-soft hover:bg-blue-500 focus-visible:ring-blue-200",
  secondary:
    "border border-slate-200/80 bg-white/80 text-slate-700 shadow-soft backdrop-blur-xl hover:bg-white focus-visible:ring-slate-200",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100/80 focus-visible:ring-slate-200"
};

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${variantClassMap[variant]} ${className}`}
      {...props}
    />
  );
}
