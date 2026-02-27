"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUpReveal } from "@/features/landing/ui/LandingMotion";

export function CtaShowcaseSection() {
  return (
    <section className="relative mt-32 px-6 pb-16">
      <motion.div
        {...fadeUpReveal()}
        className="relative mx-auto flex max-w-4xl flex-col items-center justify-center overflow-hidden rounded-[3rem] border border-im-primary/10 bg-gradient-to-br from-white via-white to-im-primary/[0.04] px-6 py-20 text-center shadow-[0_20px_60px_-20px_rgba(255,107,0,0.12)] md:py-24"
      >
        <div className="absolute -left-12 -top-12 h-52 w-52 rounded-full bg-orange-400/25 blur-[80px]" />
        <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-sky-400/20 blur-[70px]" />
        <div className="absolute -bottom-10 -left-6 h-48 w-48 rounded-full bg-emerald-400/15 blur-[80px]" />
        <div className="absolute -bottom-12 -right-10 h-52 w-52 rounded-full bg-violet-400/20 blur-[80px]" />
        <div className="absolute left-1/3 top-1/4 h-36 w-36 rounded-full bg-rose-400/15 blur-[60px]" />
        <div className="absolute right-1/4 bottom-1/3 h-40 w-40 rounded-full bg-amber-300/15 blur-[70px]" />

        {/* Main Content */}
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-im-primary">Ready to Start</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-im-text-main md:text-5xl md:leading-[1.1]">
            다음 면접,
            <br />
            준비된 상태로 들어가세요.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-im-text-muted">
            실전 압박 질문부터 4축 정밀 리포트, 약점 복습까지.
            <br className="hidden sm:block" />
            한 번의 모의 면접이 합격 확률을 바꿉니다.
          </p>

          <div className="mt-10">
            <Link
              href="/setup"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-im-primary px-10 text-lg font-extrabold text-white shadow-glow transition-all hover:-translate-y-0.5 hover:bg-im-primary-hover active:scale-95"
            >
              지금 시작하기
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
