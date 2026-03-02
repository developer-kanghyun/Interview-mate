import type {
  InterviewHistoryApiResponse,
  SessionReportResponse,
  SessionStudyResponse,
  SessionStateResponse
} from "@/shared/api/interview";
import type {
  InterviewReport,
  SessionHistoryItem
} from "@/shared/api/interview-client.types";
import {
  buildAxisScoresFromApi,
  dedupeAndLimitGuide,
  defaultStackByRole,
  mapEmotion,
  mapRole,
  mapStatus,
  pickLatestDate,
  readResponseData,
  readReportData,
  toPercentScore
} from "@/shared/api/interview-client.utils";

type HistoryAnswerItem = InterviewHistoryApiResponse["data"]["items"][number];

export function mapReportToInterviewReport(reportResponse: SessionReportResponse): InterviewReport {
  const data = readReportData(reportResponse);

  const axisScores = buildAxisScoresFromApi(data.score_summary);
  const totalScore = toPercentScore(data.score_summary.total_score);

  const questionFeedback = data.questions.map((question) => ({
    questionId: question.question_id,
    order: question.question_order,
    question: question.question_content,
    feedback: question.coaching_message || question.improvement_tip || "피드백을 불러오지 못했습니다.",
    totalScore: toPercentScore(question.score.total_score),
    whyWeak:
      question.why_weak?.trim() ||
      question.improvement_tip ||
      "핵심 개념과 근거 설명이 부족해 답변 설득력이 낮았습니다.",
    howToAnswer:
      question.how_to_answer?.trim() ||
      question.coaching_message?.trim() ||
      "답변을 결론-근거-예시 순서로 구성해 주세요.",
    exampleAnswer:
      question.example_answer?.trim() ||
      question.model_answer?.trim() ||
      "예시 답변을 생성하지 못했습니다."
  }));

  const questionGuides = data.questions.map((question) => ({
    questionId: question.question_id,
    order: question.question_order,
    question: question.question_content,
    interviewerEmotion: mapEmotion(question.interviewer_emotion),
    weakConceptKeywords: question.weak_concept_keywords ?? [],
    actionTip: question.coaching_message || question.improvement_tip || "핵심 개념부터 답변하세요.",
    howToAnswer:
      question.how_to_answer?.trim() ||
      question.coaching_message?.trim() ||
      "결론-근거-예시 구조로 답변하세요.",
    exampleAnswer:
      question.example_answer?.trim() ||
      question.model_answer?.trim() ||
      "예시 답변을 생성하지 못했습니다."
  }));

  const studyGuide = dedupeAndLimitGuide([
    ...data.priority_focuses.map((focus) => `${focus} 축을 우선적으로 보완하세요.`),
    ...data.questions
      .slice(0, 3)
      .map(
        (question) =>
          question.how_to_answer?.trim() ||
          question.coaching_message?.trim() ||
          question.improvement_tip
      )
  ]);

  const summary = `총 ${data.answered_questions}/${data.total_questions}문항 답변, 성과 레벨 ${data.performance_level}.`;

  return {
    sessionId: data.session_id,
    summary,
    totalScore,
    axisScores,
    weakKeywords: data.weak_keywords,
    questionFeedback,
    studyGuide,
    questionGuides
  };
}

export function mergeStudyDataIntoInterviewReport(
  report: InterviewReport,
  studyResponse: SessionStudyResponse
): InterviewReport {
  const studyData = readResponseData(studyResponse, "공부 가이드 조회 실패");
  const reportQuestionByOrder = new Map(report.questionFeedback.map((item) => [item.order, item] as const));

  const questionGuides = studyData.question_guides.map((guide, index) => {
    const matchedReportQuestion = reportQuestionByOrder.get(guide.question_order);
    return {
      questionId: matchedReportQuestion?.questionId ?? `study-q-${guide.question_order}-${index}`,
      order: guide.question_order,
      question: guide.question_content,
      interviewerEmotion: mapEmotion(guide.interviewer_emotion),
      weakConceptKeywords: guide.weak_concept_keywords ?? [],
      actionTip:
        guide.action_tip?.trim() ||
        matchedReportQuestion?.feedback ||
        "핵심 개념부터 답변하세요.",
      howToAnswer:
        guide.how_to_answer?.trim() ||
        matchedReportQuestion?.howToAnswer ||
        "결론-근거-예시 구조로 답변하세요.",
      exampleAnswer:
        guide.example_answer?.trim() ||
        matchedReportQuestion?.exampleAnswer ||
        guide.model_answer_preview?.trim() ||
        "예시 답변을 생성하지 못했습니다."
    };
  });

  const studyGuide = dedupeAndLimitGuide([
    ...(studyData.recommended_actions ?? []),
    ...questionGuides.slice(0, 2).map((guide) => guide.howToAnswer),
    ...report.studyGuide
  ]);

  return {
    ...report,
    weakKeywords: studyData.weak_keywords?.length ? studyData.weak_keywords : report.weakKeywords,
    studyGuide,
    questionGuides: questionGuides.length ? questionGuides : report.questionGuides
  };
}

export function mapPersistedSessionHistoryItem(params: {
  sessionId: string;
  answers: HistoryAnswerItem[];
  stateData: SessionStateResponse["data"] | null;
}): SessionHistoryItem {
  const { sessionId, answers, stateData } = params;
  const role = mapRole(stateData?.job_role);
  const scoreAverage =
    answers.length === 0
      ? 0
      : Math.round(answers.reduce((sum, item) => sum + toPercentScore(item.total_score), 0) / answers.length);
  const startedAt = pickLatestDate(answers.map((item) => item.answered_at));

  return {
    sessionId,
    startedAt,
    role,
    stack: defaultStackByRole(role),
    totalScore: scoreAverage,
    questionCount: stateData?.total_questions ?? Math.max(1, ...answers.map((item) => item.question_order)),
    status: mapStatus(stateData?.status)
  };
}
