import {
  endInterviewSession,
  getHealthStatus,
  getInterviewHistory,
  getInterviewSessionReport,
  getInterviewSessionState
} from "@/shared/api/interview";
import {
  deleteRuntimeState,
  runtimeStateEntries
} from "@/shared/api/interview-client.runtime";
import {
  mapPersistedSessionHistoryItem,
  mapReportToInterviewReport
} from "@/shared/api/interview-client.mappers";
import type {
  InterviewReport,
  SessionHistoryItem
} from "@/shared/api/interview-client.types";
import { readResponseData } from "@/shared/api/interview-client.utils";

export async function getReport(sessionId: string): Promise<InterviewReport> {
  try {
    const reportResponse = await getInterviewSessionReport(sessionId);
    const report = mapReportToInterviewReport(reportResponse);
    deleteRuntimeState(sessionId);
    return report;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message !== "세션이 아직 종료되지 않았습니다.") {
      throw error;
    }

    await endInterviewSession(sessionId, "user_end").catch(() => {
      // 이미 종료된 세션이면 무시
    });

    const fallbackReportResponse = await getInterviewSessionReport(sessionId);
    const report = mapReportToInterviewReport(fallbackReportResponse);
    deleteRuntimeState(sessionId);
    return report;
  }
}

export async function listSessions(days = 30): Promise<SessionHistoryItem[]> {
  const historyResponse = await getInterviewHistory(days);
  const historyData = readResponseData(historyResponse, "세션 목록 조회 실패");

  const groupedBySession = new Map<string, typeof historyData.items>();
  for (const item of historyData.items) {
    const grouped = groupedBySession.get(item.session_id) ?? [];
    grouped.push(item);
    groupedBySession.set(item.session_id, grouped);
  }

  const sessionIds = Array.from(groupedBySession.keys());
  const stateEntries = await Promise.all(
    sessionIds.map(async (sessionId) => {
      try {
        const stateResponse = await getInterviewSessionState(sessionId);
        const stateData = readResponseData(stateResponse, "세션 상태 조회 실패");
        return [sessionId, stateData] as const;
      } catch {
        return [sessionId, null] as const;
      }
    })
  );

  const stateMap = new Map(stateEntries);

  const historyItems = sessionIds.map((sessionId) =>
    mapPersistedSessionHistoryItem({
      sessionId,
      answers: groupedBySession.get(sessionId) ?? [],
      stateData: stateMap.get(sessionId) ?? null
    })
  );

  const runtimeOnlyItems: SessionHistoryItem[] = [];
  for (const [sessionId, runtimeState] of runtimeStateEntries()) {
    if (groupedBySession.has(sessionId)) {
      continue;
    }

    runtimeOnlyItems.push({
      sessionId,
      startedAt: runtimeState.startedAt,
      role: runtimeState.payload.jobRole,
      stack: runtimeState.payload.stack,
      totalScore: 0,
      questionCount: runtimeState.totalQuestions,
      status: runtimeState.status
    });
  }

  return [...runtimeOnlyItems, ...historyItems].sort(
    (left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()
  );
}

export async function pingBackendHealth() {
  const health = await getHealthStatus();
  if (health.status !== "UP") {
    throw new Error("백엔드 상태가 비정상입니다.");
  }
  return health;
}
