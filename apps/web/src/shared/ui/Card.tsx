import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
};

export function Card({ title, description, className = "", children, ...props }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-im-border bg-white p-5 shadow-card ${className}`}
      {...props}
    >
      {(title || description) && (
        <header className="mb-4">
          {title ? <h2 className="text-base font-bold text-im-text-main">{title}</h2> : null}
          {description ? <p className="mt-1 text-sm text-im-text-muted">{description}</p> : null}
        </header>
      )}
      {children}
    </section>
  );
}
