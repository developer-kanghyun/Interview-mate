import Image from "next/image";
import { motion } from "framer-motion";
import { fadeUp, scaleUp } from "@/features/landing/ui/landingMotions";

export function LandingInterviewerSection() {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <motion.div {...fadeUp} className="order-2 lg:order-1">
        <h2 className="text-3xl font-black tracking-tight text-im-text-main md:text-5xl">
          내게 딱 맞는
          <br />
          <span className="text-im-primary">AI 면접관 라인업</span>
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-im-text-muted">
          Interview Mate는 단순한 봇이 아닙니다. 격려와 칭찬으로 이끌어주는 <strong>&apos;루나&apos;</strong>,
          실전 시뮬레이션에 집중하는 <strong>&apos;제트&apos;</strong>, 그리고 날카로운 시선으로 압박 면접을 진행하는 <strong>&apos;아이언&apos;</strong>까지. 오늘 내 컨디션과 목표에 맞는 면접관을 선택해 긴장감을 조절하세요.
        </p>
        <ul className="mt-8 space-y-4">
          <li className="flex items-center gap-3 font-medium text-im-text-main">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-im-primary/10 text-im-primary">✓</span>
            캐릭터별 어조 차등 적용
          </li>
          <li className="flex items-center gap-3 font-medium text-im-text-main">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-im-primary/10 text-im-primary">✓</span>
            답변 수준에 따른 실시간 무드 변환
          </li>
        </ul>
      </motion.div>
      <motion.div {...scaleUp} className="pointer-events-none relative order-1 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[2.5rem] border border-im-border bg-im-subtle shadow-sm group lg:order-2">
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.05)_0,transparent_100%)]" />
        <Image src="/images/avatar_trio.png" alt="AI 면접관 트리오" fill priority className="object-cover transition-transform duration-700 group-hover:scale-105" />
      </motion.div>
    </div>
  );
}
