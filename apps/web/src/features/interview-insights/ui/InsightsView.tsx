import type { SessionHistoryItem } from "@/shared/api/interview-client";
import { SubCard } from "@/shared/cards/SubCard";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { InlineNotice } from "@/shared/ui/InlineNotice";

type InsightsViewProps = {
  sessions: SessionHistoryItem[];
  weakKeywords: string[];
  studyGuide: string[];
  isLoading: boolean;
  errorMessage: string | null;
  isRetryingWeakness: boolean;
  onRefresh: () => void | Promise<void>;
  onRetryWeakness: () => void | Promise<void>;
  onBackSetup: () => void;
};

function formatSessionStatus(status: SessionHistoryItem["status"]) {
  return status === "completed" ? "완료" : "진행중";
}

function formatRoleLabel(role: SessionHistoryItem["role"]) {
  switch (role) {
    case "backend":
      return "백엔드";
    case "frontend":
      return "프론트엔드";
    case "app":
      return "앱개발";
    case "cloud":
      return "클라우드 엔지니어링";
    case "data":
      return "데이터 분석";
    case "design":
      return "디자인/마케팅";
    case "pm":
      return "PM";
    default:
      return "백엔드";
  }
}

export function InsightsView({
  sessions,
  weakKeywords,
  studyGuide,
  isLoading,
  errorMessage,
  isRetryingWeakness,
  onRefresh,
  onRetryWeakness,
  onBackSetup
}: InsightsViewProps) {
  const isActionBusy = isLoading || isRetryingWeakness;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8">
      {/* Insights Header */}
      <header className="rounded-[2rem] border border-im-border/60 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-im-primary">study</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-im-text-main sm:text-3xl">학습하기</h1>
        <p className="mt-2 text-sm text-im-text-muted">
          최근 30일 세션 이력과 약점 키워드를 바탕으로 복습 루프를 이어갑니다.
        </p>
      </header>

      {/* Session List */}
      <SubCard title="세션 목록">
        <ul className="grid gap-3">
          {isLoading ? (
            <li className="rounded-2xl border border-im-border/50 bg-im-subtle p-4 text-sm text-im-text-muted">
              최근 30일 세션 기록을 불러오는 중입니다…
            </li>
          ) : errorMessage ? (
            <li>
              <InlineNotice
                variant="error"
                message={errorMessage}
                actions={
                  <Button variant="secondary" onClick={() => void onRefresh()} disabled={isActionBusy}>
                    다시 불러오기
                  </Button>
                }
              />
            </li>
          ) : sessions.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-im-border bg-white p-4 text-sm text-im-text-muted">
              최근 30일 세션 기록이 없습니다. 새 면접을 시작해 기록을 쌓아보세요.
            </li>
          ) : (
            sessions.map((session) => (
              <li key={session.sessionId} className="rounded-2xl border border-im-border bg-white p-4 transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:border-im-primary/30 hover:bg-im-primary/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-im-text-main">
                    {formatRoleLabel(session.role)} · {session.stack}
                  </p>
                  <Chip variant={session.status === "completed" ? "success" : "info"}>
                    {formatSessionStatus(session.status)}
                  </Chip>
                </div>
                <p className="mt-1 text-xs text-im-text-muted">{new Date(session.startedAt).toLocaleString()}</p>
                <p className="mt-2 text-sm text-im-text-muted">
                  평균 점수 {session.totalScore}점 · 답변 {session.questionCount}개
                </p>
              </li>
            ))
          )}
        </ul>
      </SubCard>

      {/* Bottom Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SubCard title="약점 키워드 모아보기">
          <div className="flex flex-wrap gap-2">
            {weakKeywords.length > 0 ? (
              weakKeywords.map((keyword) => (
                <Chip key={keyword} variant="danger">
                  {keyword}
                </Chip>
              ))
            ) : (
              <p className="text-sm text-im-text-muted">약점 키워드는 리포트 생성 후 자동으로 수집됩니다.</p>
            )}
          </div>
        </SubCard>

        <SubCard title="학습 가이드">
          <ul className="list-disc space-y-1 pl-5 text-sm text-im-text-muted">
            {studyGuide.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SubCard>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-end gap-2 rounded-[2rem] border border-im-border/60 bg-white p-3 shadow-sm">
        <Button variant="secondary" onClick={onBackSetup} disabled={isActionBusy}>
          면접 탭으로
        </Button>
        <Button onClick={() => void onRetryWeakness()} disabled={isActionBusy}>
          {isRetryingWeakness ? "재시작 준비 중…" : "약점 기반 다시 연습"}
        </Button>
      </div>
    </div>
  );
}
