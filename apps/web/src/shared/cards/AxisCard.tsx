import { Card } from "@/shared/ui/Card";
import { ProgressBar } from "@/shared/ui/ProgressBar";

type AxisCardProps = {
  title: string;
  score: number;
  description: string;
};

export function AxisCard({ title, score, description }: AxisCardProps) {
  return (
    <Card className="border-slate-200 bg-white">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{score}</p>
      <ProgressBar className="mt-3" value={score} />
      <p className="mt-2 text-xs text-slate-600">{description}</p>
    </Card>
  );
}
