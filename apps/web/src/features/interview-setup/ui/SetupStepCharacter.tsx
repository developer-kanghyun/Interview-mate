import Image from "next/image";
import type { StartInterviewPayload } from "@/shared/api/interview-client";
import { characterOptions, stepBodyClass } from "@/features/interview-setup/ui/setupView.constants";

type SetupStepCharacterProps = {
  value: StartInterviewPayload;
  onChange: (next: StartInterviewPayload) => void;
  isSetupBusy: boolean;
};

export function SetupStepCharacter({ value, onChange, isSetupBusy }: SetupStepCharacterProps) {
  return (
    <div className={stepBodyClass}>
      <div className="text-center">
        <h1 className="text-2xl font-black tracking-tight text-im-text-main sm:text-3xl">면접관을 선택해주세요.</h1>
        <p className="mt-2 text-sm text-im-text-muted">한 명을 선택하고 면접을 시작하세요.</p>
      </div>
      <div className="grid w-full gap-3">
        {characterOptions.map((character) => (
          <button
            key={character.key}
            type="button"
            disabled={isSetupBusy}
            className={`rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow,opacity] ${
              value.character === character.key
                ? "border-im-primary bg-white ring-1 ring-im-primary shadow-sm"
                : "border-im-border bg-white opacity-80 hover:border-im-primary/30 hover:opacity-100 hover:shadow-sm"
            }`}
            onClick={() => onChange({ ...value, character: character.key })}
          >
            <div className="flex items-center gap-4">
              <div
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-im-border/50 bg-gradient-to-b ${
                  character.key === "luna"
                    ? "from-sky-50 to-sky-100"
                    : character.key === "iron"
                      ? "from-rose-50 to-rose-100"
                      : "from-indigo-50 to-indigo-100"
                }`}
              >
                <Image src={`/images/avatars/${character.key}.png`} alt={`${character.name} 아바타`} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold ${value.character === character.key ? "text-im-primary" : "text-im-text-main"}`}>
                    {character.name}
                  </p>
                </div>
                <p className="mt-1 text-xs text-im-text-muted">{character.summary}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
