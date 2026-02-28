import type { InterviewCharacter } from "@/shared/api/interview-client";

export type VisualJobId = "frontend" | "backend" | "app" | "cloud" | "data" | "design" | "pm";

export const jobOptions: Array<{ id: VisualJobId; label: string }> = [
  { id: "frontend", label: "프론트엔드" },
  { id: "backend", label: "백엔드" },
  { id: "app", label: "앱개발 (iOS/Android)" },
  { id: "cloud", label: "클라우드 엔지니어링" },
  { id: "data", label: "데이터 분석" },
  { id: "design", label: "디자인 / 마케팅" },
  { id: "pm", label: "PM" }
];

export const stacksByJobId: Record<VisualJobId, string[]> = {
  frontend: ["React", "Next.js", "Vue", "Angular", "JavaScript", "TypeScript", "CSS", "Tailwind"],
  backend: ["Spring Boot", "NestJS", "Node.js", "Django", "FastAPI", "Go", "Kotlin", "Java"],
  app: ["Swift", "Kotlin", "React Native", "Flutter", "Android", "iOS"],
  cloud: ["AWS", "GCP", "Azure", "Kubernetes", "Docker", "Terraform", "CI/CD"],
  data: ["Python", "SQL", "Pandas", "Spark", "Airflow", "TensorFlow", "PyTorch"],
  design: ["Figma", "Adobe XD", "UX Research", "Google Analytics", "SEO", "Copywriting"],
  pm: ["PRD", "Roadmap", "A/B Testing", "SQL", "GA4", "Jira", "Notion"]
};

export const MAX_STACKS = 3;
export const stepBodyClass = "flex flex-col items-center gap-8";

export const characterOptions: Array<{
  key: InterviewCharacter;
  name: string;
  summary: string;
}> = [
  {
    key: "luna",
    name: "루나",
    summary: "밝은 톤의 안내형. 답변 구조를 부드럽게 교정합니다."
  },
  {
    key: "zet",
    name: "제트",
    summary: "차분한 실전형. 실무 기준의 근거를 요청합니다."
  },
  {
    key: "iron",
    name: "아이언",
    summary: "강한 압박형. 약한 답변엔 꼬리질문을 집요하게 이어갑니다."
  }
];
