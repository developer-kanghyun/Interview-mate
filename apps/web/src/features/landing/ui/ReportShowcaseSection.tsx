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

        {/* Right Column: Visualization Apple-style Card */}
        <motion.div {...fadeUpReveal({ delay: 0.1 })} className="order-1 lg:order-2 h-full flex flex-col justify-center">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-im-border/60 bg-slate-50 p-8 shadow-sm sm:p-9 h-full flex flex-col justify-center min-h-[460px]">
            {/* Animated Ambient Background Orbs */}
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

            {/* Smart Timeline Review (Apple-style) */}
            <div className="relative z-10 mt-6 w-full pl-6">
              {/* Vertical Timeline Line */}
              <div className="absolute bottom-[30px] left-[15px] top-[30px] w-px bg-slate-200/60" />

              <div className="flex flex-col gap-6">
                
                {/* Q1: Perfect */}
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
                  <div className="flex items-start justify-between gap-4 rounded-2xl bg-white/60 p-4 shadow-sm backdrop-blur-sm border border-white/40">
                    <div>
                      <p className="text-xs font-bold text-slate-400">Q1</p>
                      <p className="mt-1 text-[13px] font-medium text-slate-700">프론트엔드 성능 최적화의 주요 기법에 대해 설명해 주세요.</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">92점</span>
                  </div>
                </motion.div>

                {/* Q2: Highlight / Error (Extended Glassmorphic Card) */}
                <motion.div 
                 initial={{ opacity: 0, x: -10 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.2, duration: 0.6 }}
                 className="relative"
                >
                  <div className="absolute -left-[26px] top-6 flex h-[20px] w-[20px] items-center justify-center rounded-full bg-rose-100 ring-[6px] ring-slate-50">
                    {/* Animated Ping (Runs only 3 times then stops) */}
                    <motion.span 
                      animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                      transition={{ duration: 1.5, repeat: 2, ease: "easeOut" }}
                      className="absolute inline-flex h-full w-full rounded-full bg-rose-400" 
                    />
                    <Target className="relative h-3 w-3 text-rose-600" />
                  </div>
                  
                  <div className="rounded-[1.25rem] bg-white/95 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl border border-white relative mt-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-rose-500">Q2</p>
                        <p className="mt-1 text-[13px] font-medium text-slate-800">CORS가 무엇인지, 어떻게 해결할 수 있는지 설명해 주세요.</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 ring-1 ring-rose-200">65점</span>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50/80 p-3.5 border border-slate-100">
                      <p className="mb-1.5 text-[11px] font-bold text-rose-500 uppercase tracking-wider">깊이 감점</p>
                      <p className="text-xs leading-relaxed text-slate-600">
                        CORS의 기본 개념은 설명했으나, Preflight 요청의 조건이나 Proxy 서버를 활용하는 우회 기법 등 <strong className="font-semibold text-slate-900">다양한 해결책에 대한 깊이 있는 설명이 누락</strong>되었습니다.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Q3: Good */}
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
                  <div className="flex items-start justify-between gap-4 rounded-2xl bg-white/60 p-4 shadow-sm backdrop-blur-sm border border-white/40 opacity-80">
                    <div>
                      <p className="text-xs font-bold text-slate-400">Q3</p>
                      <p className="mt-1 text-[13px] font-medium text-slate-700">React의 useEffect Hook의 내부 동작 원리는 무엇인가요?</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">80점</span>
                  </div>
                </motion.div>

              </div>
            </div>
          </div>
        </motion.div>
      </div>

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
