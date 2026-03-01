"use client";

import { motion } from "framer-motion";
import { MessageSquare, BarChart3 } from "lucide-react";
import { fadeUpReveal } from "@/features/landing/ui/LandingMotion";
import { ReportShowcaseAxisGrid } from "@/features/landing/ui/ReportShowcaseAxisGrid";
import { ReportShowcaseTimeline } from "@/features/landing/ui/ReportShowcaseTimeline";

export function ReportShowcaseSection() {
  return (
    <div className="space-y-14">
      {/* 2-Column Grid Format */}
      <div className="mx-auto max-w-6xl grid items-center gap-12 lg:grid-cols-2">
        
        {/* Left Column: Text Content */}
        <motion.div {...fadeUpReveal()} className="order-2 lg:order-1">
          <h2 className="text-3xl font-black tracking-tight text-im-text-main md:text-5xl md:leading-[1.1]">
            합격을 가르는 디테일
            <br />
            <span className="text-im-primary">4축 정밀 채점 리포트</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-im-text-muted">
            모호한 평가 대신, 답변의 정확성·논리성·깊이·전달력을 근거와 함께 수치화합니다. 
            점수만 보여주는 것이 아니라 왜 그 점수가 나왔는지까지 설명하는 리포트입니다.
          </p>
          
          <ul className="mt-10 space-y-8">
            <li className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 shadow-sm border border-slate-200/60">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-lg text-im-text-main">질문별 피드백</p>
                <p className="mt-1 leading-relaxed text-im-text-muted">어떤 질문에서 흔들렸는지, 왜 흔들렸는지 한 눈에 확인</p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 shadow-sm border border-slate-200/60">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-lg text-im-text-main">축별 강약점 분해</p>
                <p className="mt-1 leading-relaxed text-im-text-muted">정확성·논리성·깊이·전달력 어디가 강하고 어디가 약한지 정리</p>
              </div>
            </li>
          </ul>
        </motion.div>

        <ReportShowcaseTimeline />
      </div>

      <motion.div
        {...fadeUpReveal({ delay: 0.1 })}
        className="rounded-[2.5rem] border border-im-border/70 bg-white px-6 py-6 shadow-[0_28px_70px_-48px_rgba(0,0,0,0.45)] sm:px-8 sm:py-8"
      >
        <div className="mb-6 border-b border-im-border/70 pb-5">
          <p className="text-[11px] font-bold tracking-[0.2em] text-im-primary">리포트 샘플</p>
          <p className="mt-2 text-xl font-black tracking-tight text-im-text-main sm:text-2xl">4축 진단 샘플</p>
        </div>

        <ReportShowcaseAxisGrid />

        <div className="mt-6 rounded-2xl border border-im-primary/25 bg-im-primary-soft px-4 py-3">
          <p className="text-xs leading-6 text-slate-700">
            <span className="font-bold text-im-text-main">핵심 피드백:</span> 기본 원리는 잘 짚었고, 한계 상황과 대안 근거를
            보강하면 합격권 답변에 더 가까워집니다.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
