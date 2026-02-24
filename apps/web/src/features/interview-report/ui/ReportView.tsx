import type { InterviewReport } from "@/shared/api/interview-client";
import { AxisCard } from "@/shared/cards/AxisCard";
import { MetricCard } from "@/shared/cards/MetricCard";
import { SubCard } from "@/shared/cards/SubCard";
import { TodoBox } from "@/shared/cards/TodoBox";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { InlineNotice } from "@/shared/ui/InlineNotice";

type ReportViewProps = {
  report: InterviewReport | null;
  isLoading: boolean;
  errorMessage: string | null;
  isGoingInsights: boolean;
  isBusy?: boolean;
  onRetry: () => void;
  onGoInsights: () => void;
  onRestart: () => void;
  onLogin: () => void;
};

export function ReportView({
  report,
  isLoading,
  errorMessage,
  isGoingInsights,
  isBusy = false,
  onRetry,
  onGoInsights,
  onRestart,
  onLogin
}: ReportViewProps) {
  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-slate-600">리포트를 불러오는 중입니다. 잠시만 기다려 주세요.</p>
      </div>
    );
  }

  if (errorMessage) {
    const shouldShowLogin = /로그인/.test(errorMessage);
    return (
      <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8">
        <InlineNotice variant="error" message={errorMessage} />
        <div className="flex justify-end gap-2">
          {shouldShowLogin ? (
            <Button variant="secondary" onClick={onLogin} disabled={isBusy}>
              Google 로그인
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onRestart} disabled={isBusy}>
            설정으로 이동
          </Button>
          <Button onClick={onRetry} disabled={isBusy}>
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8">
        <InlineNotice variant="info" message="표시할 리포트가 없습니다. 면접을 완료한 뒤 다시 시도해 주세요." />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onRestart} disabled={isBusy}>
            설정으로 이동
          </Button>
          <Button onClick={onRetry} disabled={isBusy}>
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8">
      <header className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Report</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">면접 리포트</h1>
        <p className="mt-2 text-sm text-slate-600">세션 종료 후 생성된 4축 평가와 질문별 피드백입니다.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-[280px,1fr]">
        <MetricCard title="총점" value={`${report.totalScore}점`} caption="100점 만점" />
        <SubCard title="세션 요약">
          <p className="text-sm leading-7 text-slate-700">{report.summary}</p>
        </SubCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AxisCard title="기술 정확도" score={report.axisScores.technical} description="핵심 개념/용어 정확도" />
        <AxisCard title="문제 해결력" score={report.axisScores.problemSolving} description="원인-해결 구조화" />
        <AxisCard title="커뮤니케이션" score={report.axisScores.communication} description="논리 흐름/문장 구성" />
        <AxisCard title="전달력" score={report.axisScores.delivery} description="간결성/설득력" />
      </div>

      <SubCard title="질문별 피드백">
        <ul className="grid gap-2">
          {report.questionFeedback.map((item) => (
            <li key={item.questionId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Q{item.order}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{item.question}</p>
              <p className="mt-2 text-sm text-slate-700">{item.feedback}</p>
              <div className="mt-2">
                <Chip variant={item.totalScore >= 75 ? "success" : item.totalScore >= 60 ? "info" : "danger"}>
                  {item.totalScore}점
                </Chip>
              </div>
            </li>
          ))}
        </ul>
      </SubCard>

      <TodoBox
        title="개선 가이드 / 키워드"
        items={[
          `약점 키워드: ${report.weakKeywords.length > 0 ? report.weakKeywords.join(", ") : "없음"}`,
          ...report.studyGuide
        ]}
      />

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onRestart} disabled={isBusy}>
          새 면접 시작
        </Button>
        <Button onClick={onGoInsights} disabled={isBusy || isGoingInsights}>
          {isGoingInsights ? "인사이트 불러오는 중..." : "인사이트 보기"}
        </Button>
      </div>
    </div>
  );
}
