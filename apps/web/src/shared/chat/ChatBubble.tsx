export type ChatRole = "interviewer" | "user" | "coach";
export type ChatTone = "default" | "error";

export type ChatBubbleProps = {
  role: ChatRole;
  content: string;
  meta?: string;
  tone?: ChatTone;
};

const roleAlignClassMap: Record<ChatRole, string> = {
  interviewer: "justify-self-start",
  user: "justify-self-end",
  coach: "justify-self-start"
};

const DEFAULT_BUBBLE_CLASS = "border-[#B5F5D8] bg-[#F2FFF8] text-slate-900 shadow-soft";
const ERROR_BUBBLE_CLASS = "border-rose-200 bg-rose-50 text-rose-900 shadow-soft";
const INTERVIEWER_BUBBLE_CLASS = "border-slate-200/80 bg-white/90 text-slate-900 shadow-soft backdrop-blur-xl";

export function ChatBubble({ role, content, tone = "default" }: ChatBubbleProps) {
  const visualClassName =
    role === "interviewer" ? INTERVIEWER_BUBBLE_CLASS : tone === "error" ? ERROR_BUBBLE_CLASS : DEFAULT_BUBBLE_CLASS;

  return (
    <article className={`max-w-[88%] rounded-2xl border px-4 py-3 ${roleAlignClassMap[role]} ${visualClassName}`}>
      <p className="whitespace-pre-wrap text-sm leading-6">{content}</p>
    </article>
  );
}
