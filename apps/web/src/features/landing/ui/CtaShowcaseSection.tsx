"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUpReveal } from "@/features/landing/ui/LandingMotion";
import { CheckCircle2, TrendingUp, Zap } from "lucide-react";

export function CtaShowcaseSection() {
  return (
    <section className="relative mt-32 px-6 pb-16">
      <motion.div
        {...fadeUpReveal()}
        className="relative mx-auto flex max-w-4xl flex-col items-center justify-center overflow-hidden rounded-[3rem] border border-im-primary/10 bg-gradient-to-br from-white via-white to-im-primary/[0.04] px-6 py-20 text-center shadow-[0_20px_60px_-20px_rgba(255,107,0,0.12)] md:py-24"
      >
        {/* Ambient Orbs */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-orange-400/20 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute bottom-10 left-1/3 h-40 w-40 rounded-full bg-rose-400/15 blur-3xl"
        />

        {/* Floating Decorative Chips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
          className="absolute left-8 top-12 hidden items-center gap-1.5 rounded-full border border-emerald-200/60 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-sm md:flex"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-[11px] font-bold text-emerald-600">정확도 94점</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
          className="absolute right-10 top-16 hidden items-center gap-1.5 rounded-full border border-sky-200/60 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-sm md:flex"
        >
          <TrendingUp className="h-3.5 w-3.5 text-sky-500" />
          <span className="text-[11px] font-bold text-sky-600">3회 연속 상승</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7, duration: 0.8, type: "spring" }}
          className="absolute bottom-14 left-12 hidden items-center gap-1.5 rounded-full border border-orange-200/60 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-sm md:flex"
        >
          <Zap className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-[11px] font-bold text-orange-600">약점 3개 해결</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.9, duration: 0.8, type: "spring" }}
          className="absolute bottom-20 right-14 hidden rounded-full border border-rose-200/60 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-sm md:block"
        >
          <span className="text-[11px] font-bold text-rose-500"># CORS Preflight</span>
        </motion.div>

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
