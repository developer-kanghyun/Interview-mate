import type {
  InterviewReport,
  ReportQuestionGuide
} from "@/features/interview-session/model/application/interviewSessionUseCases";

const DEFAULT_STUDY_GUIDE = [
  "답변을 결론-근거-예시 순서로 구조화하세요.",
  "약점 키워드 위주로 재연습 세션을 반복하세요."
];

export type ReportInsightsSummary = {
  weakKeywords: string[];
  studyGuide: string[];
  questionGuides: ReportQuestionGuide[];
};

export function selectReportInsightsSummary(report: InterviewReport | null): ReportInsightsSummary {
  if (!report) {
    return {
      weakKeywords: [],
      studyGuide: DEFAULT_STUDY_GUIDE,
      questionGuides: []
    };
  }

  return {
    weakKeywords: report.weakKeywords,
    studyGuide: report.studyGuide,
    questionGuides: report.questionGuides
  };
}
