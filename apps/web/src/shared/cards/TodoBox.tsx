import { Chip } from "@/shared/ui/Chip";

type TodoBoxProps = {
  title: string;
  items: string[];
};

export function TodoBox({ title, items }: TodoBoxProps) {
  return (
    <section className="rounded-2xl border border-dashed border-im-primary/30 bg-im-primary-soft/70 p-5">
      <header className="mb-3 flex items-center gap-2">
        <Chip variant="info">TODO</Chip>
        <h3 className="text-sm font-bold text-im-text-main">{title}</h3>
      </header>
      <ul className="list-disc space-y-1 pl-5 text-sm text-im-text-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
