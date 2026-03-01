import { Brain, Layers, Mic, Target, type LucideIcon } from "lucide-react";

export type AxisMetric = {
  label: string;
  score: number;
  colorClass: string;
  icon: LucideIcon;
  description: string;
};

export const axisMetrics: AxisMetric[] = [
  { label: "정확성", score: 94, colorClass: "bg-im-primary", icon: Target, description: "핵심 원리를 정확히 짚어냈습니다" },
  { label: "논리성", score: 88, colorClass: "bg-sky-500", icon: Brain, description: "인과관계가 명확합니다" },
  { label: "깊이", score: 76, colorClass: "bg-amber-500", icon: Layers, description: "한계점 설명이 누락되었습니다" },
  { label: "전달력", score: 92, colorClass: "bg-rose-400", icon: Mic, description: "간결하고 매끄러운 전달입니다" }
];
