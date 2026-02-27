package com.interviewmate.application.ai.usecase;

import com.interviewmate.application.ai.port.AiChatPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Locale;

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
        String systemPrompt = """
                당신은 개발자 면접관입니다. 후속 꼬리질문 1개를 생성하세요.
                출력은 질문 문장 1개만 반환하세요.
                난이도 가이드: %s
                """.formatted(buildDifficultyGuide(difficulty));

        String userPrompt = String.format(
                "직무: %s%n직무군: %s%n스택: %s%n난이도: %s%n원문 질문: %s%n지원자 답변: %s%n최근 답변 요약: %s",
                jobRole,
                resolveRoleFamily(jobRole),
                stack,
                difficulty,
                question,
                answer,
                recentAnswerSummary
        );
        try {
            String generatedQuestion = aiChatPort.requestSingleResponse(systemPrompt, userPrompt);
            if (generatedQuestion == null || generatedQuestion.isBlank()) {
                return fallbackQuestion(jobRole, difficulty);
            }
            return generatedQuestion;
        } catch (Exception exception) {
            log.warn("후속 질문 생성 실패, fallback 질문 사용: {}", exception.getMessage());
            return fallbackQuestion(jobRole, difficulty);
        }
    }

    private String buildDifficultyGuide(String difficulty) {
        if ("junior".equalsIgnoreCase(difficulty)) {
            return "핵심 근거와 실무 판단을 확인하는 질문을 만든다.";
        }
        return "취준생 기준으로 한 번에 한 개념만 확인하고, 쉬운 용어로 압박 표현 없이 질문한다.";
    }

    private String fallbackQuestion(String jobRole, String difficulty) {
        String roleFamily = resolveRoleFamily(jobRole);
        boolean junior = "junior".equalsIgnoreCase(difficulty);

        if ("frontend".equals(roleFamily)) {
            if (junior) {
                return "지금 답변에서 사용자 경험에 가장 큰 영향을 주는 근거를 한 가지 더 구체적으로 설명해 주세요.";
            }
            return "방금 답변에서 핵심 개념 하나를 쉬운 예시와 함께 다시 설명해 주세요.";
        }

        if (junior) {
            return "지금 답변의 핵심 근거를 실무 상황 한 가지와 함께 더 구체적으로 설명해 주세요.";
        }
        return "지금 답변에서 가장 중요한 개념을 한 문장으로 먼저 정리해 주세요.";
    }

    private String resolveRoleFamily(String jobRole) {
        String normalizedRole = jobRole == null ? "" : jobRole.trim().toLowerCase(Locale.ROOT);
        return switch (normalizedRole) {
            case "backend", "cloud", "data" -> "backend";
            case "frontend", "app", "design", "pm" -> "frontend";
            default -> "backend";
        };
    }
}
