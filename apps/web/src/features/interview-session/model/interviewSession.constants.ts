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

export function mapDifficultyLabel(difficulty: StartInterviewPayload["difficulty"]) {
  return difficulty === "junior" ? "주니어" : "취준생";
}
