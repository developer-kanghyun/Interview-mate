"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getMyProfile, getGoogleAuthUrl } from "@/shared/api/interview";

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
    } catch(e) {}
    window.location.reload();
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-white font-display">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-im-border bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-im-primary text-sm font-extrabold text-white">
              IM
            </div>
            <span className="text-sm font-bold tracking-tight text-im-text-main">
              Interview Mate
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/setup"
              className="rounded-full px-5 py-2 text-base font-bold text-im-text-main transition-colors hover:bg-im-surface"
            >
              면접
            </Link>
            <Link
              href="/insights"
              className="rounded-full px-5 py-2 text-base font-bold text-im-text-main transition-colors hover:bg-im-surface"
            >
              학습
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
        <section className="px-6 pb-20 pt-16 md:pb-32 md:pt-24">
          <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-12">
            <motion.article
              {...scaleUp}
              className="rounded-[2.5rem] border border-im-border/60 bg-white p-8 shadow-sm lg:col-span-7 lg:p-12"
            >
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-10 flex flex-wrap items-center gap-3"
              >
                <Link
                  href="/setup"
                  className="flex h-14 min-w-[220px] items-center justify-center gap-2 rounded-full bg-im-primary px-8 text-base font-bold text-white shadow-glow transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 hover:bg-im-primary-hover active:scale-95"
                >
                  무료로 시작하기
                </Link>
                <Link
                  href="/insights"
                  className="flex h-14 min-w-[200px] items-center justify-center rounded-full border border-im-border bg-white px-8 text-base font-bold text-im-text-main transition-[background-color,border-color,color,transform] hover:border-im-primary/30 hover:bg-im-surface"
                >
                  내 인사이트 보기
                </Link>
              </motion.div>
            </motion.article>

            <motion.aside
              {...scaleUp}
              transition={{ ...scaleUp.transition, delay: 0.1 }}
              className="relative overflow-hidden rounded-[2.5rem] border border-im-primary/15 bg-im-subtle p-0 shadow-sm lg:col-span-5 flex flex-col justify-center items-center group"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10" />
              <img
                src="/images/interview_scene.png"
                alt="AI 모의면접 - 밝고 긍정적인 분위기의 면접 장면"
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
                <div className="flex flex-col items-center text-center rounded-2xl border border-transparent bg-im-subtle/50 px-4 py-8 relative transition-all duration-300 hover:border-im-primary/30 hover:bg-im-primary/5 hover:shadow-glow">
                  <span className="text-3xl mb-2 relative z-10">🧑‍💻</span>
                  <p className="text-base font-bold text-im-text-main relative z-10">성향별 3인의 면접관</p>
                  <p className="text-sm mt-1 text-im-text-muted relative z-10">격려형 루나, 실전형 제트, 압박형 아이언. 나에게 맞는 난이도와 분위기를 선택하세요.</p>
                </div>
                <div className="flex flex-col items-center text-center rounded-2xl border border-transparent bg-im-subtle/50 px-4 py-8 relative transition-all duration-300 hover:border-im-primary/30 hover:bg-im-primary/5 hover:shadow-glow">
                  <span className="text-3xl mb-2 relative z-10">🎙️</span>
                  <p className="text-base font-bold text-im-text-main relative z-10">음성 인식 &amp; 꼬리질문</p>
                  <p className="text-sm mt-1 text-im-text-muted relative z-10">답변의 허점과 논리적 비약을 파고드는 실시간 꼬리질문으로 실전 감각을 키웁니다.</p>
                </div>
                <div className="flex flex-col items-center text-center rounded-2xl border border-transparent bg-im-subtle/50 px-4 py-8 relative transition-all duration-300 hover:border-im-primary/30 hover:bg-im-primary/5 hover:shadow-glow">
                  <span className="text-3xl mb-2 relative z-10">📊</span>
                  <p className="text-base font-bold text-im-text-main relative z-10">4축 정밀 채점 리포트</p>
                  <p className="text-sm mt-1 text-im-text-muted relative z-10">정확성, 논리성, 깊이, 전달력 기반의 입체적인 피드백을 제공합니다.</p>
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
                    존댓말과 캐릭터별 어조 차등 적용
                  </li>
                  <li className="flex items-center gap-3 text-im-text-main font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-im-primary/10 text-im-primary">✓</span>
                    답변 수준에 따른 실시간 무드 변환 (Neutral / Encourage / Pressure)
                  </li>
                </ul>
              </motion.div>
              <motion.div {...scaleUp} className="order-1 lg:order-2 relative aspect-[4/3] rounded-[2.5rem] bg-im-subtle border border-im-border overflow-hidden shadow-sm flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,96,0,0.05)_0,transparent_100%)]" />
                <div className="flex gap-4 p-8">
                  <div className="flex flex-col items-center gap-2 transform -translate-y-4">
                    <div className="w-24 h-24 rounded-full bg-white shadow-card flex items-center justify-center text-3xl">🌙</div>
                    <span className="text-sm font-bold text-im-text-main">루나</span>
                    <span className="text-xs text-im-text-muted">코치형</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 transform translate-y-4">
                    <div className="w-24 h-24 rounded-full bg-white shadow-card flex items-center justify-center text-3xl border-2 border-im-primary">⚡️</div>
                    <span className="text-sm font-bold text-im-primary">제트</span>
                    <span className="text-xs text-im-text-muted">실전형</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 transform -translate-y-4">
                    <div className="w-24 h-24 rounded-full bg-white shadow-card flex items-center justify-center text-3xl">🛡️</div>
                    <span className="text-sm font-bold text-im-text-main">아이언</span>
                    <span className="text-xs text-im-text-muted">압박형</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Feature 2: Deep Follow-up Questions */}
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <motion.div {...scaleUp} className="relative aspect-[4/3] rounded-[2.5rem] bg-slate-900 border border-slate-800 overflow-hidden shadow-sm p-8 flex flex-col justify-end">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                <div className="relative z-10 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0" />
                    <div className="bg-slate-700 text-slate-200 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[85%]">
                      JPA 영속성 컨텍스트의 이점 중 1차 캐시에 대해 설명해주세요.
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <div className="bg-im-primary text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[85%]">
                      네, 1차 캐시는 엔티티를 조회할 때 데이터를 임시로 저장하여 DB 조회를 줄여주는 역할을 합니다.
                    </div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold flex-shrink-0">Q</div>
                    <div className="bg-rose-500/10 text-rose-200 border border-rose-500/20 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[85%]">
                      (압박 꼬리질문) 동시성 이슈가 발생할 수 있는 멀티 스레드 환경에서도 1차 캐시가 안전하게 동작할까요? 그 이유는 무엇이죠?
                    </div>
                  </motion.div>
                </div>
              </motion.div>
              <motion.div {...fadeUp}>
                <h2 className="text-3xl font-black tracking-tight text-im-text-main md:text-5xl">
                  빈틈을 파고드는<br />&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-im-primary">실시간 꼬리질문</span>
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-im-text-muted">
                  단순한 일문일답은 면접이 아닙니다. 답변에서 <strong>사실 오류, 핵심 누락, 근거 부족</strong>이
                  감지되면, 면접관은 즉각적으로 압박 꼬리질문을 던집니다. 키보드 타이핑이 아닌
                  실제 목소리로 당황하지 않고 방어하는 대본 없는 진짜 면접을 경험하세요.
                </p>
                <div className="mt-8 flex gap-4">
                  <div className="flex flex-col gap-2 rounded-2xl bg-im-subtle px-5 py-4 w-1/2">
                    <span className="text-sm font-bold text-im-text-main">SSE 스트리밍</span>
                    <span className="text-xs text-im-text-muted">기다림 없는 실시간 답변 스트리밍</span>
                  </div>
                  <div className="flex flex-col gap-2 rounded-2xl bg-im-subtle px-5 py-4 w-1/2">
                    <span className="text-sm font-bold text-im-text-main">음성 기반 폴백</span>
                    <span className="text-xs text-im-text-muted">마이크 불가 시 텍스트 전환 완벽 지원</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Feature 3: 4-Axis Grading */}
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <motion.div {...fadeUp} className="order-2 lg:order-1">
                <h2 className="text-3xl font-black tracking-tight text-im-text-main md:text-5xl">
                  합격을 가르는 디테일<br /><span className="text-im-primary">4축 정밀 채점 리포트</span>
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-im-text-muted">
                  &apos;잘하셨습니다&apos; 같은 모호한 평가는 배제합니다. 제출된 답변은 AI 파이프라인과
                  도메인 규칙 검사를 거쳐 <strong>정확성, 논리성, 깊이, 전달력</strong>의
                  4축으로 세밀하게 채점됩니다. 오답 개념 키워드와 길이 제한된 모범 예시 답안을 통해
                  내일 당장 써먹을 수 있는 &apos;다음 액션&apos;을 제안받아보세요.
                </p>
                <Link
                  href="/insights"
                  className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-im-border bg-white px-6 text-sm font-bold text-im-text-main shadow-sm transition-[hover,transform] hover:border-im-primary hover:bg-im-primary/5 active:scale-95"
                >
                  리포트 샘플 보기 →
                </Link>
              </motion.div>
              <motion.div {...scaleUp} className="order-1 lg:order-2 relative aspect-[4/3] rounded-[2.5rem] bg-im-subtle border border-im-border overflow-hidden shadow-sm p-8 flex items-center justify-center">
                <div className="w-full max-w-sm space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm font-bold text-im-text-main">정확성</div>
                    <div className="h-2 flex-1 rounded-full bg-white border border-im-border/50 overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: "90%" }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-im-primary rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm font-bold text-im-text-main">논리성</div>
                    <div className="h-2 flex-1 rounded-full bg-white border border-im-border/50 overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: "75%" }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.4 }} className="h-full bg-im-primary rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm font-bold text-im-text-main">깊이</div>
                    <div className="h-2 flex-1 rounded-full bg-white border border-im-border/50 overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: "60%" }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.6 }} className="h-full bg-amber-400 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm font-bold text-im-text-main">전달력</div>
                    <div className="h-2 flex-1 rounded-full bg-white border border-im-border/50 overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: "85%" }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.8 }} className="h-full bg-im-primary rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
