import { Card } from "@/shared/ui/Card";
import { ProgressBar } from "@/shared/ui/ProgressBar";

type AxisCardProps = {
  title: string;
  score: number;
  description: string;
};

export function AxisCard({ title, score, description }: AxisCardProps) {
  return (
    <Card className="border-im-border bg-white">
      <p className="text-sm font-bold text-im-text-main">{title}</p>
      <p className="mt-1 text-2xl font-bold text-im-primary">{score}</p>
      <ProgressBar className="mt-3" value={score} />
      <p className="mt-2 text-xs text-im-text-muted">{description}</p>
    </Card>
  );
}
