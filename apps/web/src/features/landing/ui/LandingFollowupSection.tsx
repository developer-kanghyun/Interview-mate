import { motion } from "framer-motion";
import { fadeUp, scaleUp } from "@/features/landing/ui/landingMotions";

export function LandingFollowupSection() {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <motion.div
        {...scaleUp}
        className="relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-[2.5rem] border border-im-border/60 bg-slate-50 p-8 shadow-sm"
      >
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

        <div className="relative z-10 grid w-full gap-3">
          <article className="max-w-[85%] justify-self-start rounded-2xl border border-white/60 bg-white/90 px-5 py-3.5 text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl">
            <p className="whitespace-pre-wrap text-[13px] leading-[1.6] sm:text-sm">JPA 영속성 컨텍스트의 이점 중 1차 캐시에 대해 설명해주세요.</p>
          </article>

          <article className="max-w-[85%] justify-self-end rounded-2xl border border-slate-300/50 bg-slate-200 px-5 py-3.5 text-slate-900 shadow-sm">
            <p className="whitespace-pre-wrap text-[13px] leading-[1.6] sm:text-sm">네, 1차 캐시는 엔티티를 조회할 때 데이터를 임시로 저장하여 DB 조회를 줄여주는 역할을 합니다.</p>
          </article>

          <motion.article
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, type: "spring", stiffness: 200, damping: 20 }}
            className="relative max-w-[90%] justify-self-start overflow-hidden rounded-2xl border border-rose-200/50 bg-rose-100/90 px-5 py-3.5 text-rose-900 shadow-[0_8px_30px_rgba(244,63,94,0.12)] backdrop-blur-xl"
          >
            <p className="relative z-10 whitespace-pre-wrap text-[13px] font-bold leading-[1.6] text-rose-950 sm:text-sm">
              동시성 이슈가 발생할 수 있는 멀티 스레드 환경에서도 1차 캐시가 안전하게 동작할까요? 그 이유는 무엇이죠?
            </p>
          </motion.article>
        </div>
      </motion.div>

      <motion.div {...fadeUp}>
        <h2 className="text-3xl font-black tracking-tight text-im-text-main md:text-5xl">
          빈틈을 파고드는
          <br />
          <span className="text-im-primary">실시간 꼬리질문</span>
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-im-text-muted">
          단순한 일문일답은 면접이 아닙니다. 답변에서 <strong>사실 오류, 핵심 누락, 근거 부족</strong>이 감지되면, 면접관은 즉각적으로 꼬리질문을 던집니다. 키보드 타이핑이 아닌 실제 목소리로 당황하지 않고 방어하는 대본 없는 진짜 면접을 경험하세요.
        </p>
        <div className="mt-8 flex gap-4">
          <div className="w-1/2 rounded-2xl bg-im-subtle px-5 py-4">
            <span className="text-sm font-bold text-im-text-main">답변 즉시 분석</span>
            <p className="mt-2 text-xs text-im-text-muted">문장이 끝나는 순간, AI가 허점을 감지하고 후속 질문으로 이어갑니다.</p>
          </div>
          <div className="w-1/2 rounded-2xl bg-im-subtle px-5 py-4">
            <span className="text-sm font-bold text-im-text-main">음성 / 텍스트 자유 전환</span>
            <p className="mt-2 text-xs text-im-text-muted">마이크가 안 되면 텍스트로, 다시 되면 음성으로. 끊김 없이 이어갑니다.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
