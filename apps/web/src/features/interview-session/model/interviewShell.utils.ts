"use client";

import type { SessionStateResponse } from "@/shared/api/interview";
import type { StartInterviewPayload } from "@/shared/api/interview-client";
import {
  defaultStackByRole,
  mapCharacterFromApi,
  mapRole as mapRoleFromApi
} from "@/shared/api/interview-client.utils";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

export type RetryPreset = {
  jobRole?: StartInterviewPayload["jobRole"];
  stack?: StartInterviewPayload["stack"];
};

export function resolveStepFromPath(pathname: string | null): InterviewStep | null {
  if (!pathname) {
    return null;
  }
  if (pathname === "/setup") {
    return "setup";
  }
  if (pathname === "/insights" || pathname === "/study") {
    return "insights";
  }
  if (pathname === "/report" || /^\/report\/[^/]+$/.test(pathname)) {
    return "report";
  }
  if (/^\/interview\/[^/]+$/.test(pathname)) {
    return "room";
  }
  return null;
}

export function resolveSessionIdFromPath(pathname: string | null) {
  if (!pathname) {
    return null;
  }
  const matched = pathname.match(/^\/(?:interview|report)\/([^/]+)$/);
  if (!matched) {
    return null;
  }
  return decodeURIComponent(matched[1]);
}

export function buildRetryPreset(weakKeywords: string[], fallback: StartInterviewPayload): RetryPreset {
  if (fallback.jobRole !== "backend" && fallback.jobRole !== "frontend") {
    return {
      jobRole: fallback.jobRole,
      stack: fallback.stack
    };
  }

  const keywordText = weakKeywords.join(" ").toLowerCase();

  const backendSignals = ["api", "db", "sql", "transaction", "spring", "jpa", "redis", "cache", "서버", "백엔드"];
  const frontendSignals = ["react", "next", "vue", "ui", "ux", "렌더링", "상태", "프론트", "컴포넌트", "css", "접근성"];

  const hasBackendSignal = backendSignals.some((signal) => keywordText.includes(signal));
  const hasFrontendSignal = frontendSignals.some((signal) => keywordText.includes(signal));

  if (hasBackendSignal && !hasFrontendSignal) {
    return {
      jobRole: "backend",
      stack: "Spring Boot"
    };
  }

  if (hasFrontendSignal && !hasBackendSignal) {
    return {
      jobRole: "frontend",
      stack: "Next.js"
    };
  }

  return {
    jobRole: fallback.jobRole,
    stack: fallback.stack
  };
}

export function buildSetupPayloadFromSessionState(state: SessionStateResponse["data"]): StartInterviewPayload {
  const jobRole = mapRoleFromApi(state.job_role);
  return {
    jobRole,
    stack: defaultStackByRole(jobRole),
    difficulty: "jobseeker",
    questionCount: state.total_questions,
    timerSeconds: 120,
    character: mapCharacterFromApi(state.interviewer_character),
    reactionEnabled: true
  };
}
