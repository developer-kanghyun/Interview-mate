import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl items-center px-4 py-10 md:px-6">
      <section className="grid w-full gap-8 rounded-[32px] border border-white/70 bg-white/75 p-8 shadow-glass backdrop-blur-xl md:p-10">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Interview Mate</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">AI 모의면접을 실전처럼</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            직무별 질문, 꼬리질문, 4축 평가, 약점 복습까지 한 번에 제공하는 개발자 인터뷰 훈련 서비스입니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[auto,1fr] md:items-center">
          <Link
            href="/setup"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-500"
          >
            면접 시작하기
          </Link>
          <p className="text-sm text-slate-500">Setup → Room → Report → Insights 플로우를 바로 체험할 수 있습니다.</p>
        </div>
      </section>
    </main>
  );
}
