package com.interviewmate.service;

import com.interviewmate.dto.response.InterviewSessionReportResponse;
import com.interviewmate.dto.response.InterviewSessionStudyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InterviewSessionStudyService {

    private static final int MODEL_ANSWER_PREVIEW_MAX_LENGTH = 220;

    private final InterviewSessionReportService interviewSessionReportService;

    @Transactional(readOnly = true)
    public InterviewSessionStudyResponse getStudyGuide(Long sessionId, Long userId) {
        InterviewSessionReportResponse report = interviewSessionReportService.getSessionReport(sessionId, userId);

        List<InterviewSessionStudyResponse.QuestionStudyGuide> questionGuides = new ArrayList<>();
        for (InterviewSessionReportResponse.QuestionReport question : report.getQuestions()) {
            questionGuides.add(InterviewSessionStudyResponse.QuestionStudyGuide.builder()
                    .questionOrder(question.getQuestionOrder())
                    .questionContent(question.getQuestionContent())
                    .interviewerEmotion(question.getInterviewerEmotion())
                    .weakConceptKeywords(question.getWeakConceptKeywords())
                    .modelAnswerPreview(toPreview(question.getModelAnswer()))
                    .actionTip(resolveActionTip(question))
                    .build());
        }

        return InterviewSessionStudyResponse.builder()
                .sessionId(report.getSessionId())
                .jobRole(report.getJobRole())
                .performanceLevel(report.getPerformanceLevel())
                .weakKeywords(report.getWeakKeywords())
                .recommendedActions(buildRecommendedActions(report))
                .questionGuides(questionGuides)
                .build();
    }

    private List<String> buildRecommendedActions(InterviewSessionReportResponse report) {
        List<String> priorityFocuses = report.getPriorityFocuses();
        if (priorityFocuses == null || priorityFocuses.isEmpty()) {
            return List.of("강점을 유지하면서 답변 구조를 일정하게 반복 연습하세요.");
        }

        String topPriorityFocus = priorityFocuses.get(0);
        if ("정확성".equals(topPriorityFocus)) {
            return List.of("핵심 개념 정의를 1문장으로 먼저 제시하고, 이후 세부 설명을 붙이세요.");
        }
        if ("논리성".equals(topPriorityFocus)) {
            return List.of("답변을 결론-근거-예시 순서로 구성해 논리 흐름을 고정하세요.");
        }
        if ("깊이".equals(topPriorityFocus)) {
            return List.of("트레이드오프와 실무 사례를 최소 1개씩 포함해 깊이를 보강하세요.");
        }
        if ("전달력".equals(topPriorityFocus)) {
            return List.of("답변 길이를 3~5문장으로 제한하고 마지막에 1문장 요약을 추가하세요.");
        }
        return List.of("다음 연습에서 동일 질문을 1회 재답변하여 개선 폭을 확인하세요.");
    }

    private String toPreview(String modelAnswer) {
        if (modelAnswer == null) {
            return "";
        }
        if (modelAnswer.length() <= MODEL_ANSWER_PREVIEW_MAX_LENGTH) {
            return modelAnswer;
        }
        return modelAnswer.substring(0, MODEL_ANSWER_PREVIEW_MAX_LENGTH) + "...";
    }

    private String resolveActionTip(InterviewSessionReportResponse.QuestionReport question) {
        String coachingMessage = question.getCoachingMessage();
        if (coachingMessage != null && !coachingMessage.isBlank()) {
            return coachingMessage;
        }
        return question.getImprovementTip();
    }
}
