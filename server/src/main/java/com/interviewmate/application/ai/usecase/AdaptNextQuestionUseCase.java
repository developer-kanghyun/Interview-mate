package com.interviewmate.application.ai.usecase;

import com.interviewmate.application.ai.prompt.InterviewerToneGuide;
import com.interviewmate.application.ai.port.AiChatCompletionPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdaptNextQuestionUseCase {

    private final AiChatCompletionPort aiChatPort;

    public String execute(
            String jobRole,
            String stack,
            String difficulty,
            String baseQuestion,
            String recentAnswerSummary,
            String interviewerCharacter
    ) {
        if (baseQuestion == null || baseQuestion.isBlank()) {
            return baseQuestion;
        }

        try {
            String generated = aiChatPort.requestSingleResponse(
                    """
                            당신은 기술 면접관입니다.
                            다음 질문의 핵심 주제는 유지하되, 지원자의 최근 답변 약점을 반영해 질문을 1개로 보정하세요.
                            출력은 질문 문장 1개만 반환하세요.
                            %s
                            """.formatted(InterviewerToneGuide.forNextQuestionAdaptation(interviewerCharacter)),
                    """
                            직무: %s
                            스택: %s
                            난이도: %s
                            원본 다음 질문: %s
                            최근 답변 요약: %s
                            """.formatted(
                            safe(jobRole),
                            safe(stack),
                            safe(difficulty),
                            safe(baseQuestion),
                            safe(recentAnswerSummary)
                    )
            );
            if (generated == null || generated.isBlank()) {
                return baseQuestion;
            }
            return normalizeQuestion(generated, baseQuestion);
        } catch (Exception exception) {
            log.warn("다음 질문 보정 실패, 원본 질문 유지: {}", exception.getMessage());
            return baseQuestion;
        }
    }

    private String normalizeQuestion(String generated, String baseQuestion) {
        String normalized = generated
                .replaceAll("^\\d+[\\.)]\\s*", "")
                .replaceAll("^질문\\s*[:：]\\s*", "")
                .replaceAll("\\s+", " ")
                .trim();
        if (normalized.isBlank()) {
            return baseQuestion;
        }
        if (!normalized.endsWith("?")) {
            normalized = normalized + "?";
        }
        return normalized;
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
