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

const USER_BUBBLE_CLASS = "bg-slate-200 text-slate-900 shadow-sm";
const COACH_POSITIVE_BUBBLE_CLASS = "bg-[#B5F5D8] text-slate-900 shadow-sm";
const COACH_NEGATIVE_BUBBLE_CLASS = "bg-rose-100 text-rose-900 shadow-sm";
const INTERVIEWER_BUBBLE_CLASS = "bg-white/90 text-slate-900 shadow-sm backdrop-blur-xl";

export function ChatBubble({ role, content, tone = "default" }: ChatBubbleProps) {
  const visualClassName = (() => {
    if (role === "user") {
      return USER_BUBBLE_CLASS;
    }
    if (role === "coach") {
      return tone === "error" ? COACH_NEGATIVE_BUBBLE_CLASS : COACH_POSITIVE_BUBBLE_CLASS;
    }
    return INTERVIEWER_BUBBLE_CLASS;
  })();

  return (
    <article className={`max-w-[90%] rounded-2xl px-5 py-3.5 ${roleAlignClassMap[role]} ${visualClassName}`}>
      <p className="whitespace-pre-wrap text-base leading-7">{content}</p>
    </article>
  );
}
