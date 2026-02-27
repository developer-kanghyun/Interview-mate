"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getMyProfile, getGoogleAuthUrl } from "@/shared/api/interview";
import { clearStoredSessionId } from "@/shared/auth/session";
import { BrandIdentityLink } from "@/shared/ui/BrandIdentityLink";
import { ReportShowcaseSection } from "@/features/landing/ui/ReportShowcaseSection";
import { LearningShowcaseSection } from "@/features/landing/ui/LearningShowcaseSection";

const fadeUp: any = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.8, ease: "easeOut" }
};

const scaleUp: any = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  whileInView: { opacity: 1, scale: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.8, ease: "easeOut" }
};

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((res) => {
        if (res.data.email) setIsLoggedIn(true);
      })
      .catch(() => {});
  }, []);

  const handleLogin = async () => {
    setIsLoginLoading(true);
    try {
      const res = await getGoogleAuthUrl();
      window.location.href = res.data.auth_url;
    } catch (e) {
      console.error(e);
      setIsLoginLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("im_session_id");
      localStorage.removeItem("im_api_key");
      clearStoredSessionId();
    } catch(e) {}
    window.location.reload();
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-white font-display">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-im-border bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-6">
          <BrandIdentityLink />
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/setup"
              className="rounded-full px-5 py-2 text-base font-bold text-im-text-main transition-colors hover:bg-im-surface"
            >
              면접
            </Link>
            <Link
              href="/report"
              className="rounded-full px-5 py-2 text-base font-bold text-im-text-main transition-colors hover:bg-im-surface"
            >
              리포트
            </Link>
            <Link
              href="/study"
              className="rounded-full px-5 py-2 text-base font-bold text-im-text-main transition-colors hover:bg-im-surface"
            >
              study
            </Link>

            <div className="ml-2 mr-1 h-6 w-px bg-im-border/80" />

            {!isLoggedIn ? (
              <button
                onClick={handleLogin}
                disabled={isLoginLoading}
                className="rounded-full px-4 py-1.5 text-sm font-semibold text-im-text-main hover:bg-im-surface transition-colors"
              >
                로그인
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="rounded-full px-4 py-1.5 text-sm font-semibold text-im-text-muted hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                로그아웃
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-[1] flex flex-1 flex-col">
        {/* Hero Section */}
        <section className="px-6 pb-20 pt-8 md:pb-32 md:pt-12">
          <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-12">
            <motion.article
              {...scaleUp}
              className="flex h-full min-h-[500px] flex-col justify-between rounded-[2.5rem] border border-im-border/60 bg-white p-8 shadow-sm lg:col-span-7 lg:p-12"
            >
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mb-6 text-lg font-extrabold tracking-tight text-im-text-main sm:text-xl"
                >
                  ✦ 기획부터 개발, AI, 데이터, 인프라까지
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-4xl font-black tracking-tight text-im-text-main sm:text-5xl md:text-6xl md:leading-[1.1]"
                >
                  모든 IT 직군을 위한
                  <br />
                  <span className="text-im-primary">AI 실전 면접</span> 파트너
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-6 max-w-2xl text-base leading-relaxed text-im-text-muted md:text-lg"
                >
                  직무와 보유 스택에 맞춘 꼬리물기 압박 질문을 경험해보세요. 실제 목소리(음성)로 답변하고,
                  대본 없는 실전 감각을 기르며, 논리 구조와 전문성에 대한 디테일한 피드백 리포트를 받아볼 수 있습니다.
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-10 flex flex-wrap items-center gap-3"
              >
                <Link
                  href="/setup"
                  className="flex h-16 min-w-[260px] items-center justify-center gap-2 rounded-full bg-im-primary px-10 text-lg font-extrabold text-white shadow-glow transition-[background-color,transform,box-shadow] hover:-translate-y-1 hover:bg-im-primary-hover active:scale-95"
                >
                  시작하기
                </Link>
              </motion.div>
            </motion.article>

            <motion.aside
              {...scaleUp}
              transition={{ ...scaleUp.transition, delay: 0.1 }}
              className="group relative flex h-full min-h-[500px] flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border border-im-primary/15 bg-im-subtle p-0 shadow-sm lg:col-span-5"
            >
              <Image
                src="/images/interview_scene.png"
                alt="AI 모의면접 - 밝고 긍정적인 분위기의 면접 장면"
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-6 left-6 right-6 z-20 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur-md opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                <p className="text-xs font-bold text-im-primary uppercase tracking-wider">Your Best Partner</p>
                <p className="mt-1 text-sm font-bold text-im-text-main">긍정적이고 밝은 분위기에서 면접을 경험하세요.</p>
              </div>
            </motion.aside>

            {/* Core Features Overview */}
            <motion.div
              {...fadeUp}
              className="rounded-[2rem] border border-im-border/60 bg-white p-6 shadow-sm lg:col-span-12"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col items-center text-center rounded-2xl border border-transparent bg-im-subtle/50 px-4 py-8 relative transition-all duration-300 hover:border-im-primary/30 hover:shadow-glow">
                  <span className="text-3xl mb-2 relative z-10">🧑‍💻</span>
                  <p className="text-base font-bold text-im-text-main relative z-10">내 스타일에 맞는 면접관</p>
                  <p className="text-sm mt-1 text-im-text-muted relative z-10">격려형 루나, 실전형 제트, 압박형 아이언. 오늘 컨디션에 맞는 난이도를 고르세요.</p>
                </div>
                <div className="flex flex-col items-center text-center rounded-2xl border border-transparent bg-im-subtle/50 px-4 py-8 relative transition-all duration-300 hover:border-im-primary/30 hover:shadow-glow">
                  <span className="text-3xl mb-2 relative z-10">🎙️</span>
                  <p className="text-base font-bold text-im-text-main relative z-10">허점을 놓치지 않는 꼬리질문</p>
                  <p className="text-sm mt-1 text-im-text-muted relative z-10">답변 직후, 사실 오류와 논리적 비약을 즉시 파고드는 후속 질문이 이어집니다.</p>
                </div>
                <div className="flex flex-col items-center text-center rounded-2xl border border-transparent bg-im-subtle/50 px-4 py-8 relative transition-all duration-300 hover:border-im-primary/30 hover:shadow-glow">
                  <span className="text-3xl mb-2 relative z-10">📊</span>
                  <p className="text-base font-bold text-im-text-main relative z-10">감이 아닌 근거로 채점</p>
                  <p className="text-sm mt-1 text-im-text-muted relative z-10">정확성·논리성·깊이·전달력 4축 점수와 감점 사유를 한눈에 확인합니다.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="bg-white px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl space-y-32">

            {/* Feature 1: 3 Interviewers */}
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <motion.div {...fadeUp} className="order-2 lg:order-1">
                <h2 className="text-3xl font-black tracking-tight text-im-text-main md:text-5xl">
                  내게 딱 맞는<br /><span className="text-im-primary">AI 면접관 라인업</span>
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-im-text-muted">
                  Interview Mate는 단순한 봇이 아닙니다. 격려와 칭찬으로 이끌어주는 <strong>&apos;루나&apos;</strong>,
                  실전 시뮬레이션에 집중하는 <strong>&apos;제트&apos;</strong>, 그리고 날카로운 시선으로 압박 면접을
                  진행하는 <strong>&apos;아이언&apos;</strong>까지. 오늘 내 컨디션과 목표에 맞는 면접관을 선택해
                  긴장감을 조절하세요.
                </p>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-center gap-3 text-im-text-main font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-im-primary/10 text-im-primary">✓</span>
                    캐릭터별 어조 차등 적용
                  </li>
                  <li className="flex items-center gap-3 text-im-text-main font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-im-primary/10 text-im-primary">✓</span>
                    답변 수준에 따른 실시간 무드 변환
                  </li>
                </ul>
              </motion.div>
              <motion.div {...scaleUp} className="order-1 lg:order-2 relative aspect-[4/3] rounded-[2.5rem] bg-im-subtle border border-im-border overflow-hidden shadow-sm flex items-center justify-center group pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.05)_0,transparent_100%)] z-10 pointer-events-none" />
                <Image 
                  src="/images/avatar_trio.png" 
                  alt="AI 면접관 트리오" 
                  fill 
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              </motion.div>
            </div>

            {/* Feature 2: Deep Follow-up Questions */}
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <motion.div
                {...scaleUp}
                className="relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-[2.5rem] border border-im-border/60 bg-slate-50 p-8 shadow-sm"
              >
                {/* Animated Ambient Background Orbs */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-400/30 blur-3xl"
                />
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.4, 0.1] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 0.4, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 1.5 }}
                  className="absolute left-1/4 top-1/2 h-48 w-48 rounded-full bg-rose-400/30 blur-3xl"
                />

                <div className="relative z-10 grid gap-3 w-full">
                  {/* Interviewer (Initial Question) */}
                  <article className="max-w-[85%] rounded-2xl px-5 py-3.5 justify-self-start bg-white/90 text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl border border-white/60">
                    <p className="whitespace-pre-wrap text-[13px] sm:text-sm leading-[1.6]">JPA 영속성 컨텍스트의 이점 중 1차 캐시에 대해 설명해주세요.</p>
                  </article>
                  
                  {/* User (Answer) */}
                  <article className="max-w-[85%] rounded-2xl px-5 py-3.5 justify-self-end bg-slate-200 text-slate-900 shadow-sm border border-slate-300/50">
                    <p className="whitespace-pre-wrap text-[13px] sm:text-sm leading-[1.6]">네, 1차 캐시는 엔티티를 조회할 때 데이터를 임시로 저장하여 DB 조회를 줄여주는 역할을 합니다.</p>
                  </article>
                  
                  {/* Coach/Interviewer (Tail Question - Error/Negative Tone) */}
                  <motion.article
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7, type: "spring", stiffness: 200, damping: 20 }}
                    className="relative overflow-hidden max-w-[90%] rounded-2xl px-5 py-3.5 justify-self-start bg-rose-100/90 text-rose-900 shadow-[0_8px_30px_rgba(244,63,94,0.12)] backdrop-blur-xl border border-rose-200/50"
                  >
                    <p className="relative z-10 whitespace-pre-wrap text-[13px] sm:text-sm leading-[1.6] font-bold text-rose-950">
                      동시성 이슈가 발생할 수 있는 멀티 스레드 환경에서도 1차 캐시가 안전하게 동작할까요? 그 이유는 무엇이죠?
                    </p>
                  </motion.article>
                </div>
              </motion.div>
              <motion.div {...fadeUp}>
                <h2 className="text-3xl font-black tracking-tight text-im-text-main md:text-5xl">
                  빈틈을 파고드는<br /><span className="text-im-primary">실시간 꼬리질문</span>
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-im-text-muted">
                  단순한 일문일답은 면접이 아닙니다. 답변에서 <strong>사실 오류, 핵심 누락, 근거 부족</strong>이
                  감지되면, 면접관은 즉각적으로 꼬리질문을 던집니다. 키보드 타이핑이 아닌
                  실제 목소리로 당황하지 않고 방어하는 대본 없는 진짜 면접을 경험하세요.
                </p>
                <div className="mt-8 flex gap-4">
                  <div className="flex flex-col gap-2 rounded-2xl bg-im-subtle px-5 py-4 w-1/2">
                    <span className="text-sm font-bold text-im-text-main">답변 즉시 분석</span>
                    <span className="text-xs text-im-text-muted">문장이 끝나는 순간, AI가 허점을 감지하고 후속 질문으로 이어갑니다.</span>
                  </div>
                  <div className="flex flex-col gap-2 rounded-2xl bg-im-subtle px-5 py-4 w-1/2">
                    <span className="text-sm font-bold text-im-text-main">음성 / 텍스트 자유 전환</span>
                    <span className="text-xs text-im-text-muted">마이크가 안 되면 텍스트로, 다시 되면 음성으로. 끊김 없이 이어갑니다.</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="space-y-24">
              <ReportShowcaseSection />
              <LearningShowcaseSection />
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
