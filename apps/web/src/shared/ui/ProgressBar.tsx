import type { HTMLAttributes } from "react";

type ProgressBarProps = HTMLAttributes<HTMLDivElement> & {
  value: number;
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function ProgressBar({ value, className = "", ...props }: ProgressBarProps) {
  const safeValue = clampPercent(value);
  return (
    <div className={`w-full ${className}`} {...props}>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-im-subtle">
        <div className="h-full rounded-full bg-im-primary transition-[width]" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
