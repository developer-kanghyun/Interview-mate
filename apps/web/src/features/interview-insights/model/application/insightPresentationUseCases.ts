import { formatInsightSessionStatus } from "@/features/interview-insights/model/domain/insightSessionStatus";
import { formatInsightStartedAtGateway } from "@/features/interview-insights/model/infrastructure/insightDateGateway";
import type { SessionHistoryItem } from "@/features/interview-session/model/application/interviewSessionUseCases";

export function formatInsightSessionStatusUseCase(status: SessionHistoryItem["status"]) {
  return formatInsightSessionStatus(status);
}

export function formatInsightStartedAtUseCase(startedAt: string) {
  return formatInsightStartedAtGateway(startedAt);
}
