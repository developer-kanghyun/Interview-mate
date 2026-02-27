package com.interviewmate.application.ai.usecase;

import com.interviewmate.application.ai.port.AiChatPort;
import com.interviewmate.domain.ai.AnswerEvaluationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerateRealtimeCoachingUseCase {

    private final AiChatPort aiChatPort;

    public String execute(
            String jobRole,
            String stack,
            String difficulty,
            String question,
            String answer,
            AnswerEvaluationResult evaluationResult,
            String followupReason
    ) {
        String normalizedReason = safe(followupReason);
        try {
            String generated = requestCoachingWithRetry(jobRole, stack, difficulty, question, answer, evaluationResult, normalizedReason);
            if (generated == null || generated.isBlank()) {
                return fallback(evaluationResult, normalizedReason);
            }
            return generated.trim();
        } catch (Exception exception) {
            log.warn("실시간 코칭 생성 실패, fallback 코칭 사용: {}", exception.getMessage());
            return fallback(evaluationResult, normalizedReason);
        }
    }

    private String requestCoachingWithRetry(
            String jobRole,
            String stack,
            String difficulty,
            String question,
            String answer,
            AnswerEvaluationResult evaluationResult,
            String followupReason
    ) {
        try {
            return requestSingleCoaching(jobRole, stack, difficulty, question, answer, evaluationResult, followupReason);
        } catch (Exception firstException) {
            log.warn("실시간 코칭 1차 실패, 재시도 진행: {}", firstException.getMessage());
            return requestSingleCoaching(jobRole, stack, difficulty, question, answer, evaluationResult, followupReason);
        }
    }

    private String requestSingleCoaching(
            String jobRole,
            String stack,
            String difficulty,
            String question,
            String answer,
            AnswerEvaluationResult evaluationResult,
            String followupReason
    ) {
        return aiChatPort.requestSingleResponse(
                """
                        당신은 실시간 기술 면접 코치입니다.
                        지원자에게 한국어로 2문장 피드백을 제공합니다.
                        1문장: 잘한 점 또는 현재 상태 요약
                        2문장: 다음 답변에서 바로 적용할 개선 액션
                        """,
                """
                        직무: %s
                        스택: %s
                        난이도: %s
                        질문: %s
                        답변: %s
                        점수(accuracy/logic/depth/delivery/total): %.1f/%.1f/%.1f/%.1f/%.1f
                        followup_reason_detail: %s
                        """.formatted(
                        safe(jobRole),
                        safe(stack),
                        safe(difficulty),
                        safe(question),
                        safe(answer),
                        evaluationResult.getAccuracy(),
                        evaluationResult.getLogic(),
                        evaluationResult.getDepth(),
                        evaluationResult.getDelivery(),
                        evaluationResult.getTotalScore(),
                        followupReason
                )
        );
    }

    private String fallback(AnswerEvaluationResult evaluationResult, String followupReason) {
        String weakestAxis = "정확성";
        double weakestScore = evaluationResult.getAccuracy();

        if (evaluationResult.getLogic() < weakestScore) {
            weakestAxis = "논리성";
            weakestScore = evaluationResult.getLogic();
        }
        if (evaluationResult.getDepth() < weakestScore) {
            weakestAxis = "깊이";
            weakestScore = evaluationResult.getDepth();
        }
        if (evaluationResult.getDelivery() < weakestScore) {
            weakestAxis = "전달력";
        }

        if (evaluationResult.isFollowupRequired()) {
            String reasonDetail = toFriendlyReasonDetail(followupReason);
            if (!reasonDetail.isBlank()) {
                return "좋아요, 방향은 맞습니다. " + reasonDetail;
            }
            return "좋아요, 방향은 맞습니다. 다음 답변에서는 핵심 근거를 먼저 말하고 결론-근거-예시 순서로 3문장 이상 구성해보세요.";
        }

        return "핵심 흐름은 잘 잡았습니다. 다음 답변에서는 " + weakestAxis + "을 보강하기 위해 키워드 2개와 실무 예시 1개를 함께 제시해보세요.";
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private String toFriendlyReasonDetail(String followupReason) {
        String normalized = safe(followupReason);
        if (normalized.isBlank()) {
            return "";
        }
        if ("factual_error_or_uncertainty".equals(normalized)) {
            return "다음 답변에서는 핵심 개념 정의와 근거를 먼저 제시해 주세요.";
        }
        if ("missing_core_detail".equals(normalized)) {
            return "다음 답변에서는 핵심 원리와 실무 예시를 각각 한 문장씩 추가해 주세요.";
        }
        if ("weak_reasoning".equals(normalized)) {
            return "다음 답변에서는 결론-근거-예시 순서로 논리 흐름을 명확히 구성해 주세요.";
        }
        if ("followup_limit_reached".equals(normalized)) {
            return "꼬리질문 한도에 도달했습니다. 다음 질문에서 구조화된 답변을 시도해 주세요.";
        }
        return normalized;
    }
}
