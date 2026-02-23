import type { SessionHistoryItem } from "@/shared/api/interview-client";
import { SubCard } from "@/shared/cards/SubCard";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";

type InsightsViewProps = {
  sessions: SessionHistoryItem[];
  weakKeywords: string[];
  studyGuide: string[];
  onRetryWeakness: () => void | Promise<void>;
  onBackSetup: () => void;
};

function formatSessionStatus(status: SessionHistoryItem["status"]) {
  return status === "completed" ? "완료" : "진행중";
}

export function InsightsView({ sessions, weakKeywords, studyGuide, onRetryWeakness, onBackSetup }: InsightsViewProps) {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">인사이트 / 히스토리</h1>
        <p className="text-sm text-slate-600">최근 30일 세션 이력과 약점 키워드를 바탕으로 복습 루프를 이어갑니다.</p>
      </header>

      <SubCard title="세션 목록">
        <ul className="grid gap-2">
          {sessions.length === 0 ? (
            <li className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-600">
              세션 기록이 없습니다.
            </li>
          ) : (
            sessions.map((session) => (
              <li key={session.sessionId} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {session.role === "backend" ? "백엔드" : "프론트엔드"} · {session.stack}
                  </p>
                  <Chip variant={session.status === "completed" ? "success" : "info"}>
                    {formatSessionStatus(session.status)}
                  </Chip>
                </div>
                <p className="mt-1 text-xs text-slate-500">{new Date(session.startedAt).toLocaleString()}</p>
                <p className="mt-2 text-sm text-slate-700">
                  평균 점수 {session.totalScore}점 · 답변 {session.questionCount}개
                </p>
              </li>
            ))
          )}
        </ul>
      </SubCard>

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
              <p className="text-sm text-slate-600">아직 수집된 약점 키워드가 없습니다.</p>
            )}
          </div>
        </SubCard>

        <SubCard title="학습 가이드">
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {studyGuide.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SubCard>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onBackSetup}>
          면접 탭으로
        </Button>
        <Button onClick={() => void onRetryWeakness()}>약점 기반 다시 연습</Button>
      </div>
    </div>
  );
}
