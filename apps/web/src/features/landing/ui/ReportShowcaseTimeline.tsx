"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Target } from "lucide-react";
import { fadeUpReveal } from "@/features/landing/ui/LandingMotion";

export function ReportShowcaseTimeline() {
  return (
    <motion.div {...fadeUpReveal({ delay: 0.1 })} className="order-1 flex h-full flex-col justify-center lg:order-2">
      <div className="relative flex min-h-[460px] flex-col justify-center overflow-hidden rounded-[2.25rem] border border-im-border/60 bg-slate-50 p-8 shadow-sm sm:p-9">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-400/30 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-rose-400/20 blur-3xl"
        />

        <div className="relative z-10 mt-6 w-full pl-6">
          <div className="absolute bottom-[30px] left-[15px] top-[30px] w-px bg-slate-200/60" />
          <div className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -left-6 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-slate-50">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              </div>
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/40 bg-white/60 p-4 shadow-sm backdrop-blur-sm">
                <div>
                  <p className="text-xs font-bold text-slate-400">Q1</p>
                  <p className="mt-1 text-[13px] font-medium text-slate-700">
                    프론트엔드 성능 최적화의 주요 기법에 대해 설명해 주세요.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">92점</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -left-[26px] top-6 flex h-[20px] w-[20px] items-center justify-center rounded-full bg-rose-100 ring-[6px] ring-slate-50">
                <motion.span
                  animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                  transition={{ duration: 1.5, repeat: 2, ease: "easeOut" }}
                  className="absolute inline-flex h-full w-full rounded-full bg-rose-400"
                />
                <Target className="relative h-3 w-3 text-rose-600" />
              </div>

              <div className="relative mt-2 rounded-[1.25rem] border border-white bg-white/95 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-rose-500">Q2</p>
                    <p className="mt-1 text-[13px] font-medium text-slate-800">
                      CORS가 무엇인지, 어떻게 해결할 수 있는지 설명해 주세요.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 ring-1 ring-rose-200">
                    65점
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-500">깊이 감점</p>
                  <p className="text-xs leading-relaxed text-slate-600">
                    CORS의 기본 개념은 설명했으나, Preflight 요청의 조건이나 Proxy 서버를 활용하는 우회 기법 등{" "}
                    <strong className="font-semibold text-slate-900">다양한 해결책에 대한 깊이 있는 설명이 누락</strong>
                    되었습니다.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -left-6 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-sky-100 ring-4 ring-slate-50">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              </div>
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/40 bg-white/60 p-4 opacity-80 shadow-sm backdrop-blur-sm">
                <div>
                  <p className="text-xs font-bold text-slate-400">Q3</p>
                  <p className="mt-1 text-[13px] font-medium text-slate-700">
                    React의 useEffect Hook의 내부 동작 원리는 무엇인가요?
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">80점</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
