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
        try {
            String generated = aiChatPort.requestSingleResponse(
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
                            followup_reason: %s
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
                            safe(followupReason)
                    )
            );
            if (generated == null || generated.isBlank()) {
                return fallback(evaluationResult, followupReason);
            }
            return generated.trim();
        } catch (Exception exception) {
            log.warn("실시간 코칭 생성 실패, fallback 코칭 사용: {}", exception.getMessage());
            return fallback(evaluationResult, followupReason);
        }
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
            String focusPoint = "핵심 근거";
            if ("factual_error_or_uncertainty".equals(followupReason)) {
                focusPoint = "정확한 개념 정의";
            } else if ("missing_core_detail".equals(followupReason)) {
                focusPoint = "핵심 원리와 예시";
            } else if ("weak_reasoning".equals(followupReason)) {
                focusPoint = "근거 중심의 추론";
            }
            return "좋아요, 방향은 맞습니다. 다음 답변에서는 " + focusPoint + "를 먼저 말하고 결론-근거-예시 순서로 3문장 이상 구성해보세요.";
        }

        return "핵심 흐름은 잘 잡았습니다. 다음 답변에서는 " + weakestAxis + "을 보강하기 위해 키워드 2개와 실무 예시 1개를 함께 제시해보세요.";
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
