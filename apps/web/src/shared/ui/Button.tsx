import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    "bg-im-primary text-white shadow-soft hover:bg-im-primary-hover focus-visible:ring-im-primary/30 active:scale-[0.97]",
  secondary:
    "border border-im-border bg-white text-im-text-main hover:bg-im-subtle focus-visible:ring-im-primary/20 active:scale-[0.97]",
  ghost:
    "bg-transparent text-im-text-muted hover:bg-im-subtle focus-visible:ring-im-primary/20"
};

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold transition-[background-color,color,border-color,box-shadow,transform,opacity] focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${variantClassMap[variant]} ${className}`}
      {...props}
    />
  );
}
