import type { SessionHistoryItem } from "@/features/interview-session/model/application/interviewSessionUseCases";

export function formatInsightSessionStatus(status: SessionHistoryItem["status"]) {
  return status === "completed" ? "완료" : "진행중";
}
