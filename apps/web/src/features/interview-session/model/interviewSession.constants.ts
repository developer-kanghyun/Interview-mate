import type { InterviewCharacter, StartInterviewPayload } from "@/shared/api/interview-client";

export type InterviewStep = "setup" | "room" | "report" | "insights";

export const defaultSetupPayload: StartInterviewPayload = {
  jobRole: "backend",
  stack: "Spring Boot",
  difficulty: "jobseeker",
  questionCount: 7,
  timerSeconds: 120,
  character: "zet",
  reactionEnabled: true
};

export const interviewerNameMap: Record<InterviewCharacter, string> = {
  luna: "루나",
  zet: "제트",
  iron: "아이언"
};

export function mapRoleLabel(role: StartInterviewPayload["jobRole"]) {
  return role === "backend" ? "백엔드" : "프론트엔드";
}

export function mapDifficultyLabel(difficulty: StartInterviewPayload["difficulty"]) {
  return difficulty === "junior" ? "주니어" : "취준생";
}
