import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl items-center px-4 py-10 md:px-6">
      <section className="grid w-full gap-8 rounded-[36px] border border-white/80 bg-white/80 p-8 shadow-glass backdrop-blur-2xl md:p-12">
        <div className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Interview Mate</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
              개발자 면접을
              <br />
              실전처럼 훈련한다
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              Setup부터 Room, Report, Insights까지 한 사이클로 연결된 훈련 흐름으로 약점을 빠르게 반복 학습합니다.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                AI 꼬리질문
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                4축 리포트
              </span>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                약점 기반 재시작
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Workflow</p>
            <ol className="mt-3 grid gap-3 text-sm text-slate-700">
              <li className="rounded-xl border border-slate-200 bg-slate-50 p-3">1. Setup: 직무/스택/난이도 설정</li>
              <li className="rounded-xl border border-slate-200 bg-slate-50 p-3">2. Room: 질문 스트리밍 + 답변 제출</li>
              <li className="rounded-xl border border-slate-200 bg-slate-50 p-3">3. Report/Insights: 피드백 분석 및 재도전</li>
            </ol>
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-200/80 pt-5 md:grid-cols-[auto,auto,1fr] md:items-center">
          <Link href="/setup" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-500">
            면접 시작하기
          </Link>
          <Link href="/settings" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            기본값 설정
          </Link>
          <p className="text-sm text-slate-500">반응형 웹에서 바로 체험 가능하며 로그인 후 결과를 이어서 확인할 수 있습니다.</p>
        </div>
      </section>
    </main>
  );
}
