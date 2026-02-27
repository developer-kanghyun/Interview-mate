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
    <div className="space-y-12">
      <motion.div {...fadeUpReveal()} className="mx-auto max-w-4xl text-center">
        <h2 className="mt-3 text-4xl font-black tracking-tight text-im-text-main md:text-6xl md:leading-[1.08]">
          틀린 곳만 골라서
          <br />
          <span className="text-im-primary">다시 붙잡는 복습 루프</span>
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-im-text-muted md:text-lg">
          면접이 끝나면 자동으로 취약 키워드를 모으고, 틀렸던 부분만
          골라서 재도전 질문 세트로 반복 훈련합니다.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {learningCards.map((card) => (
          <motion.div
            key={card.title}
            variants={staggerItem}
            className="rounded-[2rem] border border-im-border/70 bg-white px-5 py-6 shadow-[0_20px_50px_-42px_rgba(0,0,0,0.5)]"
          >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-im-primary-soft text-im-primary">
              <card.icon className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <p className="text-base font-black tracking-tight text-im-text-main">{card.title}</p>
            <p className="mt-2 text-sm leading-7 text-im-text-muted">{card.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
