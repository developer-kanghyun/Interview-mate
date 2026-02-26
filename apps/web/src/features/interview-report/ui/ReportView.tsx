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
  errorCode?: "auth_required" | "unknown" | null;
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
  errorCode = null,
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
        <div className="rounded-[2rem] border border-im-border/60 bg-white p-6 text-sm text-im-text-muted shadow-sm">
          리포트를 불러오는 중입니다. 잠시만 기다려 주세요.
        </div>
      </div>
    );
  }

  if (errorMessage) {
    const isAuthError = errorCode === "auth_required";
    return (
      <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8">
        <InlineNotice variant="error" message={errorMessage} />
        <div className="flex flex-wrap justify-end gap-2 rounded-[2rem] border border-im-border/60 bg-white p-3 shadow-sm">
          {isAuthError ? (
            <Button variant="secondary" onClick={onLogin} disabled={isBusy}>
              Google 로그인
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onRestart} disabled={isBusy}>
            설정으로 이동
          </Button>
          {!isAuthError ? (
            <Button onClick={onRetry} disabled={isBusy}>
              다시 시도
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center py-20 px-4 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-im-subtle text-4xl shadow-card">
          📝
        </div>
        <h2 className="mb-2 text-xl font-bold text-im-text-main">진행한 면접이 없습니다</h2>
        <p className="mb-8 text-sm leading-relaxed text-im-text-muted">
          리포트를 확인하시려면 먼저 모의 면접을 완료해야 합니다.<br />
          당신의 실력을 점검하고 상세한 피드백을 받아보세요!
        </p>
        <Button onClick={onRestart} disabled={isBusy} className="px-8 shadow-glow">
          🚀 새로운 면접 시작하기
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8">
      {/* Report Header */}
      <header className="rounded-[2rem] border border-im-border/60 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-im-primary">Report</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-im-text-main sm:text-3xl">면접 리포트</h1>
        <p className="mt-2 text-sm text-im-text-muted">세션 종료 후 생성된 4축 평가와 질문별 피드백입니다.</p>
      </header>

      {/* Score + Summary */}
      <div className="grid gap-4 md:grid-cols-[280px,1fr]">
        <MetricCard title="총점" value={`${report.totalScore}점`} caption="100점 만점" />
        <SubCard title="세션 요약">
          <p className="text-sm leading-7 text-im-text-muted">{report.summary}</p>
        </SubCard>
      </div>

      {/* 4-Axis Scores */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AxisCard title="기술 정확도" score={report.axisScores.technical} description="핵심 개념/용어 정확도" />
        <AxisCard title="문제 해결력" score={report.axisScores.problemSolving} description="원인-해결 구조화" />
        <AxisCard title="커뮤니케이션" score={report.axisScores.communication} description="논리 흐름/문장 구성" />
        <AxisCard title="전달력" score={report.axisScores.delivery} description="간결성/설득력" />
      </div>

      {/* Question Feedback */}
      <SubCard title="질문별 피드백">
        <ul className="grid gap-3">
          {report.questionFeedback.map((item) => (
            <li key={item.questionId} className="rounded-2xl border border-im-border bg-im-subtle p-4 transition-[background-color,border-color,box-shadow] hover:border-im-primary/30 hover:bg-im-primary/5 hover:shadow-glow">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-im-text-muted">Q{item.order}</p>
                <Chip variant={item.totalScore >= 75 ? "success" : item.totalScore >= 60 ? "info" : "danger"}>
                  {item.totalScore}점
                </Chip>
              </div>
              <p className="mt-2 text-sm font-bold text-im-text-main">{item.question}</p>
              <p className="mt-2 text-sm text-im-text-muted">{item.feedback}</p>
            </li>
          ))}
        </ul>
      </SubCard>

      {/* Study Guide */}
      <TodoBox
        title="개선 가이드 / 키워드"
        items={[
          `약점 키워드: ${report.weakKeywords.length > 0 ? report.weakKeywords.join(", ") : "없음"}`,
          ...report.studyGuide
        ]}
      />

      {/* Actions */}
      <div className="flex flex-wrap justify-end gap-2 rounded-[2rem] border border-im-border/60 bg-white p-3 shadow-sm">
        <Button variant="secondary" onClick={onRestart} disabled={isBusy}>
          새 면접 시작
        </Button>
        <Button onClick={onGoInsights} disabled={isBusy || isGoingInsights}>
          {isGoingInsights ? "인사이트 불러오는 중…" : "인사이트 보기"}
        </Button>
      </div>
    </div>
  );
}
