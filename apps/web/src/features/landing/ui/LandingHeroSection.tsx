import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, scaleUp } from "@/features/landing/ui/landingMotions";

export function LandingHeroSection() {
  return (
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
              직무와 보유 스택에 맞춘 꼬리물기 압박 질문을 경험해보세요. 실제 목소리(음성)로 답변하고, 대본 없는 실전 감각을 기르며, 논리 구조와 전문성에 대한 디테일한 피드백 리포트를 받아볼 수 있습니다.
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
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute bottom-6 left-6 right-6 z-20 translate-y-4 rounded-2xl bg-white/90 p-4 opacity-0 shadow-lg backdrop-blur-md transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="text-xs font-bold uppercase tracking-wider text-im-primary">Your Best Partner</p>
            <p className="mt-1 text-sm font-bold text-im-text-main">긍정적이고 밝은 분위기에서 면접을 경험하세요.</p>
          </div>
        </motion.aside>

        <motion.div {...fadeUp} className="rounded-[2rem] border border-im-border/60 bg-white p-6 shadow-sm lg:col-span-12">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="relative flex flex-col items-center rounded-2xl border border-transparent bg-im-subtle/50 px-4 py-8 text-center transition-all duration-300 hover:border-im-primary/30 hover:shadow-glow">
              <span className="relative z-10 mb-2 text-3xl">🧑‍💻</span>
              <p className="relative z-10 text-base font-bold text-im-text-main">내 스타일에 맞는 면접관</p>
              <p className="relative z-10 mt-1 text-sm text-im-text-muted">격려형 루나, 실전형 제트, 압박형 아이언. 오늘 컨디션에 맞는 난이도를 고르세요.</p>
            </div>
            <div className="relative flex flex-col items-center rounded-2xl border border-transparent bg-im-subtle/50 px-4 py-8 text-center transition-all duration-300 hover:border-im-primary/30 hover:shadow-glow">
              <span className="relative z-10 mb-2 text-3xl">🎙️</span>
              <p className="relative z-10 text-base font-bold text-im-text-main">허점을 놓치지 않는 꼬리질문</p>
              <p className="relative z-10 mt-1 text-sm text-im-text-muted">답변 직후, 사실 오류와 논리적 비약을 즉시 파고드는 후속 질문이 이어집니다.</p>
            </div>
            <div className="relative flex flex-col items-center rounded-2xl border border-transparent bg-im-subtle/50 px-4 py-8 text-center transition-all duration-300 hover:border-im-primary/30 hover:shadow-glow">
              <span className="relative z-10 mb-2 text-3xl">📊</span>
              <p className="relative z-10 text-base font-bold text-im-text-main">감이 아닌 근거로 채점</p>
              <p className="relative z-10 mt-1 text-sm text-im-text-muted">정확성·논리성·깊이·전달력 4축 점수와 감점 사유를 한눈에 확인합니다.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
