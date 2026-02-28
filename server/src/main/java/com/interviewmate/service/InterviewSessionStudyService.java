package com.interviewmate.service;

import com.interviewmate.dto.response.InterviewSessionReportResponse;
import com.interviewmate.dto.response.InterviewSessionStudyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InterviewSessionStudyService {

    private static final int MODEL_ANSWER_PREVIEW_MAX_LENGTH = 220;
    private static final int MAX_RECOMMENDED_ACTIONS = 3;

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
                    .howToAnswer(resolveHowToAnswer(question))
                    .exampleAnswer(resolveExampleAnswer(question))
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
        Map<String, Boolean> deduplicated = new LinkedHashMap<>();
        List<String> priorityFocuses = report.getPriorityFocuses();
        if (priorityFocuses != null) {
            for (String focus : priorityFocuses) {
                String action = mapFocusToAction(focus);
                if (!action.isBlank()) {
                    deduplicated.putIfAbsent(action, true);
                }
                if (deduplicated.size() >= MAX_RECOMMENDED_ACTIONS) {
                    break;
                }
            }
        }

        if (deduplicated.size() < MAX_RECOMMENDED_ACTIONS && report.getWeakKeywords() != null) {
            for (String weakKeyword : report.getWeakKeywords()) {
                String normalized = weakKeyword == null ? "" : weakKeyword.trim().toLowerCase(Locale.ROOT);
                if (normalized.isBlank()) {
                    continue;
                }
                deduplicated.putIfAbsent("약점 키워드 '" + weakKeyword + "'로 1분 답변 스크립트를 작성해 반복 연습하세요.", true);
                if (deduplicated.size() >= MAX_RECOMMENDED_ACTIONS) {
                    break;
                }
            }
        }

        if (deduplicated.isEmpty()) {
            deduplicated.put("강점을 유지하면서 답변 구조를 일정하게 반복 연습하세요.", true);
        }

        return new ArrayList<>(deduplicated.keySet()).subList(0, Math.min(MAX_RECOMMENDED_ACTIONS, deduplicated.size()));
    }

    private String mapFocusToAction(String focus) {
        if ("정확성".equals(focus)) {
            return "핵심 개념 정의를 1문장으로 먼저 제시하고, 이후 세부 설명을 붙이세요.";
        }
        if ("논리성".equals(focus)) {
            return "답변을 결론-근거-예시 순서로 구성해 논리 흐름을 고정하세요.";
        }
        if ("깊이".equals(focus)) {
            return "트레이드오프와 실무 사례를 최소 1개씩 포함해 깊이를 보강하세요.";
        }
        if ("전달력".equals(focus)) {
            return "답변 길이를 3~5문장으로 제한하고 마지막에 1문장 요약을 추가하세요.";
        }
        return "";
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

    private String resolveHowToAnswer(InterviewSessionReportResponse.QuestionReport question) {
        if (question.getHowToAnswer() != null && !question.getHowToAnswer().isBlank()) {
            return question.getHowToAnswer();
        }
        return "답변을 결론-근거-예시 순서로 구성해 핵심 메시지를 먼저 전달하세요.";
    }

    private String resolveExampleAnswer(InterviewSessionReportResponse.QuestionReport question) {
        if (question.getExampleAnswer() != null && !question.getExampleAnswer().isBlank()) {
            return question.getExampleAnswer();
        }
        return toPreview(question.getModelAnswer());
    }
}
