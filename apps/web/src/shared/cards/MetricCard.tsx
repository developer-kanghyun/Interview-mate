import { Card } from "@/shared/ui/Card";

type MetricCardProps = {
  title: string;
  value: string;
  caption?: string;
};

export function MetricCard({ title, value, caption }: MetricCardProps) {
  return (
    <Card className="border-im-primary/20 bg-im-primary-soft/70">
      <p className="text-xs font-semibold uppercase tracking-wide text-im-primary">{title}</p>
      <p className="mt-2 text-3xl font-bold leading-none text-im-text-main">{value}</p>
      {caption ? <p className="mt-2 text-xs text-im-text-muted">{caption}</p> : null}
    </Card>
  );
}
