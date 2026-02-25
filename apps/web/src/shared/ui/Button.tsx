import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "xl";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    "bg-im-primary text-white shadow-soft hover:bg-im-primary-hover focus-visible:ring-im-primary/30 active:scale-[0.97]",
  secondary:
    "border border-im-border bg-white text-im-text-main hover:bg-im-subtle focus-visible:ring-im-primary/20 active:scale-[0.97]",
  ghost:
    "bg-transparent text-im-text-muted hover:bg-im-subtle focus-visible:ring-im-primary/20"
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-xs font-semibold",
  md: "px-5 py-2.5 text-sm font-semibold",
  lg: "px-6 py-3 text-base font-bold",
  xl: "px-8 py-3.5 text-lg font-extrabold"
};

export function Button({ variant = "primary", size = "md", className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-2xl transition-[background-color,color,border-color,box-shadow,transform,opacity] focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClassMap[size]} ${variantClassMap[variant]} ${className}`}
      {...props}
    />
  );
}
