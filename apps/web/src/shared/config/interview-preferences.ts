import type { StartInterviewPayload } from "@/shared/api/interview-client";

const INTERVIEW_PREFERENCES_STORAGE_KEY = "interviewMatePreferences";

export type InterviewPreferences = Pick<StartInterviewPayload, "jobRole" | "stack" | "difficulty" | "character">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidJobRole(value: unknown): value is StartInterviewPayload["jobRole"] {
  return value === "backend" || value === "frontend";
}

function isValidDifficulty(value: unknown): value is StartInterviewPayload["difficulty"] {
  return value === "jobseeker" || value === "junior";
}

function isValidCharacter(value: unknown): value is StartInterviewPayload["character"] {
  return value === "zet" || value === "luna" || value === "iron";
}

function normalizePreferences(value: unknown): InterviewPreferences | null {
  if (!isRecord(value)) {
    return null;
  }

  const { jobRole, stack, difficulty, character } = value;
  if (!isValidJobRole(jobRole) || typeof stack !== "string" || !isValidDifficulty(difficulty) || !isValidCharacter(character)) {
    return null;
  }

  const trimmedStack = stack.trim();
  if (!trimmedStack) {
    return null;
  }

  return {
    jobRole,
    stack: trimmedStack,
    difficulty,
    character
  };
}

export function getInterviewPreferences(): InterviewPreferences | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(INTERVIEW_PREFERENCES_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return normalizePreferences(parsed);
  } catch {
    return null;
  }
}

export function setInterviewPreferences(value: InterviewPreferences) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(INTERVIEW_PREFERENCES_STORAGE_KEY, JSON.stringify(value));
}
