import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white font-display">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-im-border bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-im-primary text-sm font-extrabold text-white">
              IM
            </div>
            <span className="text-lg font-bold tracking-tight text-im-text-main">
              Interview Mate
            </span>
          </div>
          <Link
            href="/setup"
            className="rounded-full bg-im-primary/10 px-5 py-2 text-sm font-bold text-im-primary transition-[background-color,color,transform] hover:bg-im-primary hover:text-white active:scale-95"
          >
            시작하기 →
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center px-6 pb-24 pt-20 md:pb-32 md:pt-32">
          <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-im-primary/5 blur-3xl" />

          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-im-primary/20 bg-im-primary/5 px-4 py-1.5 text-sm font-medium text-im-primary">
              ✦ AI 기반 실전 면접 트레이닝
            </div>

            <h1 className="mb-6 text-4xl font-black tracking-tight text-im-text-main sm:text-5xl md:text-6xl md:leading-[1.1]">
              AI 면접관과 함께하는
              <br />
              <span className="text-im-primary">완벽한 면접 준비</span>
            </h1>

            <p className="mb-10 max-w-2xl text-base leading-relaxed text-im-text-muted md:text-lg">
              원하는 직무, 난이도를 설정하고 실제 면접과 유사한 환경에서
              <br className="hidden sm:block" />
              무제한 모의 면접을 경험하세요. 상세한 피드백으로 합격률을 높여드립니다.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Link
                href="/setup"
                className="flex h-14 min-w-[200px] items-center justify-center gap-2 rounded-full bg-im-primary px-8 text-base font-bold text-white shadow-glow transition-[background-color,transform,box-shadow] hover:scale-105 hover:bg-im-primary-hover active:scale-95"
              >
                지금 🚀 시작하기
              </Link>
            </div>

            {/* Social Proof */}
            <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm font-semibold text-im-text-muted md:gap-16">
              <span>👥 10,000+ 유저</span>
              <span>✅ 95% 합격률 상승</span>
              <span>🏢 500+ 기업 데이터</span>
            </div>
          </div>
        </section>

        {/* Recent Records */}
        <section className="border-t border-im-border bg-im-subtle px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 px-2">
              <h2 className="text-2xl font-bold text-im-text-main">최근 면접 기록</h2>
              <p className="mt-1 text-sm text-im-text-muted">
                지난 모의 면접 결과를 확인하고 복습해보세요.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Card 1 */}
              <div className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-im-border bg-white p-6 shadow-card transition-[border-color,box-shadow,transform] duration-300 hover:border-im-primary/30 hover:shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-im-primary-soft text-lg">
                      🖥️
                    </div>
                    <div>
                      <h3 className="font-bold text-im-text-main group-hover:text-im-primary">
                        백엔드 개발자 (Junior)
                      </h3>
                      <p className="text-xs font-medium text-im-text-muted">기술 면접</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                    85점
                  </span>
                </div>
                <div className="mt-auto space-y-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full w-[85%] rounded-full bg-im-primary" />
                  </div>
                  <div className="flex justify-between text-xs text-im-text-muted">
                    <span>답변 완성도</span>
                    <span className="font-medium text-im-text-main">우수함</span>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-im-border bg-white p-6 shadow-card transition-[border-color,box-shadow,transform] duration-300 hover:border-im-primary/30 hover:shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-im-primary-soft text-lg">
                      🎨
                    </div>
                    <div>
                      <h3 className="font-bold text-im-text-main group-hover:text-im-primary">
                        프론트엔드 (Junior)
                      </h3>
                      <p className="text-xs font-medium text-im-text-muted">인성/협업 면접</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-bold text-yellow-600">
                    진행중
                  </span>
                </div>
                <div className="mt-auto space-y-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full w-[40%] rounded-full bg-yellow-500" />
                  </div>
                  <div className="flex justify-between text-xs text-im-text-muted">
                    <span>진행률</span>
                    <span className="font-medium text-im-text-main">40%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
