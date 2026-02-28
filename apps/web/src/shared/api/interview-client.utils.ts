import type { SessionReportResponse } from "@/shared/api/interview";
import type {
  AxisScores,
  InterviewCharacter,
  InterviewEmotion,
  InterviewRole
} from "@/shared/api/interview-client.types";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function toPercentScore(score: number | null | undefined) {
  if (!Number.isFinite(score)) {
    return 0;
  }

  const numericScore = Number(score);
  if (numericScore <= 5.0) {
    return clamp(Math.round(numericScore * 20), 0, 100);
  }

  return clamp(Math.round(numericScore), 0, 100);
}

export function mapCharacterToApi(character: InterviewCharacter): "luna" | "jet" | "iron" {
  if (character === "zet") {
    return "jet";
  }
  return character;
}

export function mapCharacterFromApi(character: "luna" | "jet" | "iron" | null | undefined): InterviewCharacter {
  if (character === "jet") {
    return "zet";
  }
  if (character === "luna") {
    return "luna";
  }
  return "iron";
}

export function mapEmotion(value: string | null | undefined): InterviewEmotion {
  if (value === "encourage") {
    return "encourage";
  }
  if (value === "pressure") {
    return "pressure";
  }
  return "neutral";
}

export function mapRole(value: string | null | undefined): InterviewRole {
  switch (value) {
    case "frontend":
      return "frontend";
    case "backend":
      return "backend";
    case "app":
      return "app";
    case "cloud":
      return "cloud";
    case "data":
      return "data";
    case "design":
      return "design";
    case "pm":
      return "pm";
    default:
      return "backend";
  }
}

export function mapStatus(value: string | null | undefined): "in_progress" | "completed" {
  return value === "completed" ? "completed" : "in_progress";
}

export function toIsoDate(value: string | null | undefined) {
  if (!value) {
    return new Date().toISOString();
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

export function buildAxisScoresFromApi(data: {
  accuracy: number;
  logic: number;
  depth: number;
  delivery: number;
}): AxisScores {
  return {
    technical: toPercentScore(data.accuracy),
    problemSolving: toPercentScore(data.logic),
    communication: toPercentScore(data.depth),
    delivery: toPercentScore(data.delivery)
  };
}

export function readResponseData<T>(response: { success: boolean; data: T }, fallbackMessage: string): T {
  if (!response.success) {
    throw new Error(fallbackMessage);
  }
  return response.data;
}

function isUnwrappedReportPayload(value: unknown): value is SessionReportResponse["data"] {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<SessionReportResponse["data"]>;
  return (
    typeof candidate.session_id === "string" &&
    typeof candidate.total_questions === "number" &&
    typeof candidate.answered_questions === "number" &&
    typeof candidate.score_summary === "object" &&
    candidate.score_summary !== null &&
    Array.isArray(candidate.questions)
  );
}

export function readReportData(response: SessionReportResponse | SessionReportResponse["data"]) {
  if (isUnwrappedReportPayload(response)) {
    return response;
  }
  return readResponseData(response, "리포트 조회 실패");
}

export function dedupeAndLimitGuide(items: Array<string | null | undefined>) {
  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const rawItem of items) {
    const item = rawItem?.trim();
    if (!item) {
      continue;
    }
    if (seen.has(item)) {
      continue;
    }
    seen.add(item);
    deduped.push(item);
    if (deduped.length >= 3) {
      break;
    }
  }

  return deduped;
}

export function defaultStackByRole(role: InterviewRole) {
  switch (role) {
    case "frontend":
      return "Next.js";
    case "backend":
      return "Spring Boot";
    case "app":
      return "React Native";
    case "cloud":
      return "AWS";
    case "data":
      return "Python";
    case "design":
      return "Figma";
    case "pm":
      return "PRD";
    default:
      return "Spring Boot";
  }
}

export function pickLatestDate(values: string[]) {
  if (values.length === 0) {
    return new Date().toISOString();
  }

  return (
    values
      .map((value) => new Date(value).getTime())
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => b - a)
      .map((value) => new Date(value).toISOString())[0] ?? new Date().toISOString()
  );
}
