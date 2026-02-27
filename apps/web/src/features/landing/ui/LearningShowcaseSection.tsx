"use client";

import { motion } from "framer-motion";
import { BookOpenCheck, ListChecks, RotateCcw, type LucideIcon } from "lucide-react";
import { fadeUpReveal, staggerContainer, staggerItem } from "@/features/landing/ui/LandingMotion";

type LearningCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const learningCards: LearningCard[] = [
  {
    title: "약점 키워드 자동 수집",
    description: "자주 흔들린 개념을 자동으로 모아 우선순위 중심으로 복습합니다.",
    icon: BookOpenCheck
  },
  {
    title: "틀렸던 문제만 다시",
    description: "같은 실수를 반복하지 않도록, 틀렸던 논점을 재도전 질문으로 재구성합니다.",
    icon: RotateCcw
  },
  {
    title: "면접전 체크리스트",
    description: "복습 순서와 체크리스트를 자동 제안해 D-day까지 실전 체력을 끌어올립니다.",
    icon: ListChecks
  }
];

export function LearningShowcaseSection() {
  return (
    <div className="space-y-16">
      <motion.div {...fadeUpReveal()} className="mx-auto max-w-4xl text-center">
        <h2 className="mt-3 text-4xl font-black tracking-tight text-im-text-main md:text-5xl md:leading-[1.1]">
          틀린 곳만 골라서
          <br />
          <span className="text-im-primary">다시 붙잡는 복습 루프</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-im-text-muted md:text-lg">
          면접이 끝나면 자동으로 취약 키워드를 모으고, 틀렸던 부분만
          골라서 재도전 질문 세트로 반복 훈련합니다.
        </p>
      </motion.div>

      <motion.div
        {...fadeUpReveal({ delay: 0.1 })}
        className="grid gap-6 lg:grid-cols-[1.2fr,1fr]"
      >
        {/* Left Visual Hub: Weakness Scanner */}
        <div className="relative overflow-hidden rounded-[2.25rem] border border-im-border/60 bg-slate-50 p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
          {/* Ambient Orbs - Very subtle and slow */}
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-orange-400/20 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl"
          />

          <div className="relative z-10 w-full max-w-[320px]">
            {/* The Magnetizing Target Area */}
            <div className="relative rounded-[1.5rem] border border-white/80 bg-white/70 p-6 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-md">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-500 ring-4 ring-white">
                <RotateCcw className="h-6 w-6" strokeWidth={2} />
              </div>
              <p className="text-sm font-bold text-slate-800">재도전 질문 세트 생성 중...</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">발견된 취약 키워드 3개 결합 완료</p>

              {/* Status Loader */}
              <div className="mx-auto mt-5 h-1.5 w-3/4 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: "0%" }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 2, ease: "easeInOut" }}
                  className="h-full bg-orange-400"
                />
              </div>
            </div>

            {/* Floating Weakness Chips (Subtle Magnet Effect) */}
            <motion.div
              initial={{ opacity: 0, y: 30, x: -30 }}
              whileInView={{ opacity: 1, y: -10, x: 20 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: 0.8, type: "spring" }}
              className="absolute -top-12 -left-6 rounded-full border border-rose-200/60 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-rose-600 shadow-sm backdrop-blur-sm"
            >
              # JPA 영속성
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -30, x: 30 }}
              whileInView={{ opacity: 1, y: 10, x: -20 }}
              viewport={{ once: true }}
              transition={{ delay: 1.1, duration: 0.8, type: "spring" }}
              className="absolute -right-8 top-16 rounded-full border border-sky-200/60 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-sky-600 shadow-sm backdrop-blur-sm"
            >
              # CORS Preflight
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30, x: 10 }}
              whileInView={{ opacity: 1, y: 15, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.4, duration: 0.8, type: "spring" }}
              className="absolute -bottom-8 left-12 rounded-full border border-emerald-200/60 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-emerald-600 shadow-sm backdrop-blur-sm"
            >
              # React useEffect
            </motion.div>
          </div>
        </div>

        {/* Right Feature Cards (Vertical Layout) */}
        <div className="flex flex-col gap-6">
          <div className="flex-1 rounded-[2.25rem] border border-im-border/60 bg-white p-8 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-im-subtle text-im-primary">
              <BookOpenCheck className="h-6 w-6" strokeWidth={2} />
            </div>
            <h3 className="mt-5 text-xl font-bold tracking-tight text-im-text-main">약점 키워드 자동 수집</h3>
            <p className="mt-3 text-[14px] leading-relaxed text-im-text-muted">
              면접에서 자주 흔들린 개념을 AI가 알아서 노트로 모아줍니다.
              일일이 오답 노트를 만들 필요 없이, 내가 모르는 부분에만 집중하세요.
            </p>
          </div>

          <div className="flex-1 rounded-[2.25rem] border border-im-border/60 bg-white p-8 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-im-subtle text-slate-600">
              <ListChecks className="h-6 w-6" strokeWidth={2} />
            </div>
            <h3 className="mt-5 text-xl font-bold tracking-tight text-im-text-main">D-day 체크리스트 제안</h3>
            <p className="mt-3 text-[14px] leading-relaxed text-im-text-muted">
              면접 직전에 읽기 좋은 형태의 보완 체크리스트를 자동 생성합니다. 
              방대한 전공 지식 대신, 내 약점 위주의 핵심으로 실전 체력을 올립니다.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
