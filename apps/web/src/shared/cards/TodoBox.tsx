import { Chip } from "@/shared/ui/Chip";

type TodoBoxProps = {
  title: string;
  items: string[];
};

export function TodoBox({ title, items }: TodoBoxProps) {
  return (
    <section className="rounded-xl border border-dashed border-blue-300 bg-blue-50 p-4">
      <header className="mb-2 flex items-center gap-2">
        <Chip variant="info">TODO</Chip>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </header>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
