type SetupProgressProps = {
  step: 1 | 2 | 3;
};

export function SetupProgress({ step }: SetupProgressProps) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`h-2 rounded-full transition-[width,background-color] duration-300 ${
            s === step ? "w-8 bg-im-primary" : s < step ? "w-2 bg-im-primary/40" : "w-2 bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}
