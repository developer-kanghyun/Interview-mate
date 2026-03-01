import type { InterviewPreferences } from "@/shared/config/interview-preferences";

export const defaultPreferences: InterviewPreferences = {
  jobRole: "backend",
  stack: "Spring Boot",
  difficulty: "jobseeker",
  character: "zet"
};

export const stackOptionsByRole: Record<InterviewPreferences["jobRole"], string[]> = {
  backend: ["Spring Boot", "NestJS", "Node.js", "Django"],
  frontend: ["React", "Next.js", "Vue", "TypeScript"],
  app: ["React Native", "Flutter", "Swift", "Kotlin"],
  cloud: ["AWS", "GCP", "Kubernetes", "Terraform"],
  data: ["Python", "SQL", "Pandas", "Spark"],
  design: ["Figma", "UX Research", "Google Analytics", "SEO"],
  pm: ["PRD", "Roadmap", "A/B Testing", "GA4"]
};
