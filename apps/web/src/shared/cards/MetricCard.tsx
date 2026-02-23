import { Card } from "@/shared/ui/Card";

type MetricCardProps = {
  title: string;
  value: string;
  caption?: string;
};

export function MetricCard({ title, value, caption }: MetricCardProps) {
  return (
    <Card className="border-blue-100/80 bg-gradient-to-br from-white to-blue-50/70">
      <p className="text-xs uppercase tracking-wide text-blue-700">{title}</p>
      <p className="mt-2 text-3xl font-bold leading-none text-slate-900">{value}</p>
      {caption ? <p className="mt-2 text-xs text-slate-500">{caption}</p> : null}
    </Card>
  );
}
