package com.interviewmate.application.ai.usecase;

import com.interviewmate.application.ai.port.AiChatPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerateFollowupQuestionUseCase {

    private final AiChatPort aiChatPort;

    public String execute(
            String jobRole,
            String stack,
            String difficulty,
            String question,
            String answer,
            String recentAnswerSummary
    ) {
        String systemPrompt = "당신은 개발자 면접관입니다. 후속 꼬리질문 1개를 생성하세요.";
        String userPrompt = String.format(
                "직무: %s%n스택: %s%n난이도: %s%n원문 질문: %s%n지원자 답변: %s%n최근 답변 요약: %s",
                jobRole, stack, difficulty, question, answer, recentAnswerSummary
        );
        try {
            String generatedQuestion = aiChatPort.requestSingleResponse(systemPrompt, userPrompt);
            if (generatedQuestion == null || generatedQuestion.isBlank()) {
                return fallbackQuestion(jobRole);
            }
            return generatedQuestion;
        } catch (Exception exception) {
            log.warn("후속 질문 생성 실패, fallback 질문 사용: {}", exception.getMessage());
            return fallbackQuestion(jobRole);
        }
    }

    private String fallbackQuestion(String jobRole) {
        if ("frontend".equalsIgnoreCase(jobRole)) {
            return "지금 답변에서 렌더링 성능과 사용자 경험 관점을 더 구체적으로 설명해 주세요.";
        }
        return "지금 답변의 핵심 근거를 예시와 함께 더 구체적으로 설명해 주세요.";
    }
}
