import type { ReactNode } from "react";

type SubCardProps = {
  title: string;
  children: ReactNode;
};

export function SubCard({ title, children }: SubCardProps) {
  return (
    <section className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-soft backdrop-blur-xl">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}
