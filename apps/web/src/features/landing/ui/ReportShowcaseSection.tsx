"use client";

import { motion } from "framer-motion";
import { Brain, Layers, Mic, Target, MessageSquare, BarChart3, CheckCircle2, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { fadeUpReveal, staggerContainer, staggerItem } from "@/features/landing/ui/LandingMotion";

type AxisMetric = {
  label: string;
  score: number;
  colorClass: string;
  icon: LucideIcon;
  description: string;
};

const axisMetrics: AxisMetric[] = [
  { label: "정확성", score: 94, colorClass: "bg-im-primary", icon: Target, description: "핵심 원리를 정확히 짚어냈습니다" },
  { label: "논리성", score: 88, colorClass: "bg-sky-500", icon: Brain, description: "인과관계가 명확합니다" },
  { label: "깊이", score: 76, colorClass: "bg-amber-500", icon: Layers, description: "한계점 설명이 누락되었습니다" },
  { label: "전달력", score: 92, colorClass: "bg-rose-400", icon: Mic, description: "간결하고 매끄러운 전달입니다" }
];

function AnimatedStatNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let startTime: number | undefined;
    const duration = 1500;

    const update = (currentTime: number) => {
      if (!startTime) {
        startTime = currentTime;
      }
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.floor(value * eased));
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }, [value]);

  return <span>{display}</span>;
}

export function ReportShowcaseSection() {
  return (
    <div className="space-y-14">
      <motion.div {...fadeUpReveal()} className="mx-auto max-w-5xl text-center">
        <h2 className="mt-3 text-4xl font-black tracking-tight text-im-text-main md:text-6xl md:leading-[1.08]">
          합격을 가르는 디테일
          <br />
          <span className="text-im-primary">4축 정밀 채점 리포트</span>
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-im-text-muted md:text-lg">
          모호한 평가 대신, 답변의 정확성·논리성·깊이·전달력을 근거와 함께 수치화합니다. 점수만 보여주는 것이 아니라
          왜 그 점수가 나왔는지까지 설명하는 리포트입니다.
        </p>
      </motion.div>

      <motion.div
        {...fadeUpReveal({ delay: 0.06 })}
        className="grid gap-5 lg:grid-cols-[1.08fr,1fr]"
      >
        <div className="group relative overflow-hidden rounded-[2.25rem] border border-slate-800/90 bg-[#0B0C10] p-8 text-white shadow-[0_28px_70px_-38px_rgba(0,0,0,0.85)] sm:p-9 flex flex-col justify-between">
          {/* Animated Tech Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]" />
          
          {/* Animated Ambient Glow */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-24 -right-12 h-64 w-64 rounded-full bg-orange-500/20 blur-[64px]"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-blue-500/20 blur-[64px]"
          />

          {/* Scanning Laser Line */}
          <motion.div
            animate={{ y: ["0%", "400%", "0%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-orange-400/50 to-transparent shadow-[0_0_15px_rgba(251,146,60,0.5)]"
          />

          <div className="relative z-10">
            <div className="flex gap-2.5 items-center">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
              </span>
              <p className="text-[11px] font-bold tracking-[0.2em] text-orange-400">REPORT ENGINE</p>
            </div>
            <h3 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">점수 뒤의 이유까지 보여주는 평가</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              답변 문장만 보지 않고, 개념 정확도와 인과 구조, 설계 깊이, 전달 명확성을 함께 분석합니다.
              감점 이유와 보완 지점을 바로 확인할 수 있습니다.
            </p>
          </div>

          <div className="relative z-10 mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-2xl">
            {/* Window Header */}
            <div className="mb-6 flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-600" />
              <div className="h-2.5 w-2.5 rounded-full bg-slate-600" />
              <div className="h-2.5 w-2.5 rounded-full bg-slate-600" />
            </div>

            {/* 4-Axis Scores Visual */}
            <div className="grid gap-4">
              {/* Row 1 */}
              <div className="flex items-center gap-4">
                <div className="w-16 shrink-0 text-xs font-medium text-slate-400">정확성</div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: "94%" }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.1 }} className="absolute inset-y-0 left-0 bg-orange-400" />
                </div>
                <div className="w-8 shrink-0 text-right text-xs font-bold text-white">94</div>
              </div>
              {/* Row 2 */}
              <div className="flex items-center gap-4">
                <div className="w-16 shrink-0 text-xs font-medium text-slate-400">논리성</div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: "72%" }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }} className="absolute inset-y-0 left-0 bg-rose-400" />
                </div>
                <div className="w-8 shrink-0 text-right text-xs font-bold text-white">72</div>
              </div>
              {/* Row 3 */}
              <div className="flex items-center gap-4">
                <div className="w-16 shrink-0 text-xs font-medium text-slate-400">깊이</div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: "88%" }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.3 }} className="absolute inset-y-0 left-0 bg-blue-400" />
                </div>
                <div className="w-8 shrink-0 text-right text-xs font-bold text-white">88</div>
              </div>
              {/* Row 4 */}
              <div className="flex items-center gap-4">
                <div className="w-16 shrink-0 text-xs font-medium text-slate-400">전달력</div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: "95%" }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.4 }} className="absolute inset-y-0 left-0 bg-emerald-400" />
                </div>
                <div className="w-8 shrink-0 text-right text-xs font-bold text-white">95</div>
              </div>
            </div>

            {/* AI Deduction Highlight */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="relative mt-6 overflow-hidden rounded-xl border border-rose-500/30 bg-rose-500/10 p-4"
            >
              <div className="absolute left-0 top-0 h-full w-1 bg-rose-500" />
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-rose-400" />
                <span className="text-xs font-bold text-rose-300">Targeting: 논리성 (72점)</span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
                &quot;비즈니스 로직은 컨트롤러의 역할&quot;이라는 응답에서 <strong className="text-white">개념 혼동</strong>이 감지되었습니다.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-[2.25rem] border border-im-border/70 bg-white p-8 shadow-[0_22px_55px_-40px_rgba(0,0,0,0.35)] sm:p-9 relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-50" />
          
          <div className="relative z-10 flex flex-col gap-6 w-full">
            {/* Feature 1: Question Feedback */}
            <motion.div 
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: 0.1 }}
             className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200/60 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-sm">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">질문별 피드백</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">어떤 질문에서 흔들렸는지, 왜 감점되었는지 질의응답 타임라인에서 바로 확인</p>
              </div>
            </motion.div>

            {/* Feature 2: 4-Axis Radar */}
            <motion.div 
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: 0.2 }}
             className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200/60 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shadow-sm">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="w-full">
                <p className="text-sm font-bold text-slate-800 mb-2">축별 강약점 분해</p>
                {/* Mini Visual Chart */}
                <div className="space-y-1.5 w-full max-w-[200px]">
                  <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-indigo-500 w-[85%] rounded-full" /></div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-indigo-400 w-[60%] rounded-full" /></div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-indigo-300 w-[40%] rounded-full" /></div>
                </div>
              </div>
            </motion.div>

            {/* Feature 3: Action Items */}
            <motion.div 
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: 0.3 }}
             className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200/60 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shadow-sm">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">다음 면접 액션 제안</p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1.5"><div className="h-1 w-1 rounded-full bg-emerald-500" /><div className="h-1.5 w-16 bg-slate-200 rounded-full" /></div>
                  <div className="flex items-center gap-1.5"><div className="h-1 w-1 rounded-full bg-emerald-500" /><div className="h-1.5 w-24 bg-slate-200 rounded-full" /></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <motion.div
        {...fadeUpReveal({ delay: 0.1 })}
        className="rounded-[2.5rem] border border-im-border/70 bg-white px-6 py-6 shadow-[0_28px_70px_-48px_rgba(0,0,0,0.45)] sm:px-8 sm:py-8"
      >
        <div className="mb-6 border-b border-im-border/70 pb-5">
          <p className="text-[11px] font-bold tracking-[0.2em] text-im-primary">리포트 샘플</p>
          <p className="mt-2 text-xl font-black tracking-tight text-im-text-main sm:text-2xl">4축 진단 샘플</p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-4 sm:grid-cols-2"
        >
          {axisMetrics.map((metric) => (
            <motion.div
              key={metric.label}
              variants={staggerItem}
              className="rounded-2xl border border-im-border/70 bg-white px-4 py-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${metric.colorClass}/10`}>
                    <metric.icon className={`h-4 w-4 ${metric.colorClass.replace("bg-", "text-")}`} strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-bold text-im-text-main">{metric.label}</span>
                </div>
                <span className={`text-sm font-black tabular-nums ${metric.colorClass.replace("bg-", "text-")}`}>
                  <AnimatedStatNumber value={metric.score} />점
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${metric.colorClass}`} style={{ width: `${metric.score}%` }} />
              </div>
              <p className="mt-2 text-xs leading-6 text-slate-500">{metric.description}</p>
            </motion.div>
          ))}
        </motion.div>

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
