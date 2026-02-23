"use client";

type CharacterType = "luna" | "jet" | "iron";
type EmotionType = "neutral" | "encourage" | "pressure";

function getCharacterLabel(character: CharacterType) {
  if (character === "luna") {
    return "루나";
  }
  if (character === "iron") {
    return "아이언";
  }
  return "제트";
}

function getMouthPath(emotion: EmotionType) {
  if (emotion === "encourage") {
    return "M34 52 Q40 58 46 52";
  }
  if (emotion === "pressure") {
    return "M34 55 Q40 50 46 55";
  }
  return "M34 54 Q40 55 46 54";
}

export default function InterviewerAvatarAnimated({
  character,
  emotion
}: {
  character: CharacterType;
  emotion: EmotionType;
}) {
  const characterBackgroundClass =
    character === "luna"
      ? "from-sky-50 to-sky-100"
      : character === "iron"
        ? "from-rose-50 to-rose-100"
        : "from-indigo-50 to-indigo-100";
  const emotionRingClass =
    emotion === "pressure"
      ? "border-rose-300 shadow-[0_0_16px_rgba(225,29,72,0.2)]"
      : emotion === "encourage"
        ? "border-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.18)]"
        : "border-slate-200";

  return (
    <div
      className={`h-[108px] w-[108px] overflow-hidden rounded-xl border bg-gradient-to-b ${characterBackgroundClass} ${emotionRingClass}`}
      aria-label={`${getCharacterLabel(character)} 캐릭터`}
    >
      <svg className="block h-full w-full" viewBox="0 0 96 96" role="img" aria-hidden="true">
        <defs>
          <linearGradient id={`bg-${character}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={character === "luna" ? "#f8feff" : character === "jet" ? "#f6f8ff" : "#fff8f8"} />
            <stop offset="100%" stopColor={character === "luna" ? "#dff5ff" : character === "jet" ? "#e5ebff" : "#ffe3e3"} />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="96" height="96" rx="14" fill={`url(#bg-${character})`} />
        <g className="motion-safe:animate-pulse">
          <ellipse cx="48" cy="84" rx="22" ry="6" className="fill-slate-900/15" />

          <rect x="32" y="55" width="32" height="22" rx="10" fill="#e9efff" stroke="#2f405c" strokeWidth="2" />
          <circle cx="48" cy="40" r="22" fill="#ffffff" stroke="#2f405c" strokeWidth="2" />

          <circle cx="40" cy="38" r="2.8" fill="#22324a" />
          <circle cx="56" cy="38" r="2.8" fill="#22324a" />
          <path d={getMouthPath(emotion)} fill="none" stroke="#22324a" strokeWidth="2.2" strokeLinecap="round" />

          {emotion === "pressure" ? (
            <>
              <path d="M35 32 L42 34" fill="none" stroke="#22324a" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M54 34 L61 32" fill="none" stroke="#22324a" strokeWidth="2.2" strokeLinecap="round" />
            </>
          ) : null}

          {emotion === "encourage" ? (
            <>
              <circle cx="33" cy="46" r="2.2" fill="#ffb7ca" opacity="0.8" />
              <circle cx="63" cy="46" r="2.2" fill="#ffb7ca" opacity="0.8" />
            </>
          ) : null}

          {character === "luna" ? <ellipse cx="48" cy="14" rx="14" ry="4" fill="none" stroke="#71ccff" strokeWidth="3" className="origin-center animate-spin [animation-duration:6.8s]" /> : null}
          {character === "jet" ? <rect x="30" y="34" width="36" height="8" rx="4" fill="#4269e8" stroke="#2c4cae" className="animate-pulse" /> : null}
          {character === "iron" ? <circle cx="48" cy="13" r="9" fill="none" stroke="#c83939" strokeWidth="3" className="animate-pulse" /> : null}
        </g>
      </svg>
    </div>
  );
}
