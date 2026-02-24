import type { ReactNode } from "react";

type SubCardProps = {
  title: string;
  children: ReactNode;
};

export function SubCard({ title, children }: SubCardProps) {
  return (
    <section className="rounded-2xl border border-im-border bg-white p-5 shadow-card">
      <h3 className="text-sm font-bold text-im-text-main">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}
