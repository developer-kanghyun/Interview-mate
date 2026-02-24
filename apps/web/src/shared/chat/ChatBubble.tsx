import { Chip } from "@/shared/ui/Chip";

export type ChatRole = "interviewer" | "user" | "coach";

export type ChatBubbleProps = {
  role: ChatRole;
  content: string;
  meta?: string;
};

const roleClassMap: Record<ChatRole, string> = {
  interviewer: "justify-self-start border-slate-200/80 bg-white/85 text-slate-900 shadow-soft backdrop-blur-xl",
  user: "justify-self-end border-im-primary/25 bg-im-primary-soft text-slate-900 shadow-soft",
  coach: "justify-self-start border-emerald-200/80 bg-emerald-50/90 text-slate-900 shadow-soft"
};

const roleLabelMap: Record<ChatRole, string> = {
  interviewer: "면접관",
  user: "나",
  coach: "코치"
};

export function ChatBubble({ role, content, meta }: ChatBubbleProps) {
  return (
    <article className={`max-w-[88%] rounded-2xl border px-4 py-3 ${roleClassMap[role]}`}>
      <header className="mb-2 flex items-center gap-2">
        <Chip
          variant={role === "user" ? "info" : role === "coach" ? "success" : "default"}
          className="text-[11px]"
        >
          {roleLabelMap[role]}
        </Chip>
        {meta ? <span className="text-xs text-slate-500">{meta}</span> : null}
      </header>
      <p className="whitespace-pre-wrap text-sm leading-6">{content}</p>
    </article>
  );
}
