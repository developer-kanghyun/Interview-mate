type LoadingSpinnerSize = "sm" | "md" | "lg";
type LoadingSpinnerTone = "primary" | "muted" | "on-primary";

type LoadingSpinnerProps = {
  size?: LoadingSpinnerSize;
  tone?: LoadingSpinnerTone;
  className?: string;
  label?: string;
};

const sizeClassMap: Record<LoadingSpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-7 w-7 border-[3px]"
};

const toneClassMap: Record<LoadingSpinnerTone, string> = {
  primary: "border-im-primary/25 border-t-im-primary",
  muted: "border-slate-300 border-t-slate-500",
  "on-primary": "border-white/35 border-t-white"
};

export function LoadingSpinner({ size = "md", tone = "primary", className = "", label }: LoadingSpinnerProps) {
  return (
    <span className={`inline-flex items-center ${className}`} role={label ? "status" : undefined} aria-live={label ? "polite" : undefined}>
      <span
        aria-hidden="true"
        className={`inline-block animate-spin rounded-full ${sizeClassMap[size]} ${toneClassMap[tone]}`}
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
