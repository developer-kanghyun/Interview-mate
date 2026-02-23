import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
};

export function Card({ title, description, className = "", children, ...props }: CardProps) {
  return (
    <section className={`rounded-2xl border border-white/70 bg-white/75 p-4 shadow-soft backdrop-blur-xl ${className}`} {...props}>
      {(title || description) && (
        <header className="mb-3">
          {title ? <h2 className="text-base font-semibold text-slate-900">{title}</h2> : null}
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </header>
      )}
      {children}
    </section>
  );
}
