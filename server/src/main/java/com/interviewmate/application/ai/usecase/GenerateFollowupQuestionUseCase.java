package com.interviewmate.application.ai.usecase;

import com.interviewmate.application.ai.prompt.InterviewerToneGuide;
import com.interviewmate.application.ai.port.AiChatCompletionPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerateFollowupQuestionUseCase {

    private final AiChatCompletionPort aiChatPort;

    public String execute(
            String jobRole,
            String stack,
            String difficulty,
            String question,
            String answer,
            String recentAnswerSummary,
            String interviewerCharacter
    ) {
        String systemPrompt = """
                당신은 개발자 면접관입니다. 후속 꼬리질문 1개를 생성하세요.
                %s
                """.formatted(InterviewerToneGuide.forFollowupQuestion(interviewerCharacter));
        String userPrompt = String.format(
                "직무: %s%n스택: %s%n난이도: %s%n원문 질문: %s%n지원자 답변: %s%n최근 답변 요약: %s",
                jobRole, stack, difficulty, question, answer, recentAnswerSummary
        );
        try {
            String generatedQuestion = aiChatPort.requestSingleResponse(systemPrompt, userPrompt);
            if (generatedQuestion == null || generatedQuestion.isBlank()) {
                return fallbackQuestion(jobRole);
            }
            return normalizeQuestion(generatedQuestion, fallbackQuestion(jobRole), interviewerCharacter);
        } catch (Exception exception) {
            log.warn("후속 질문 생성 실패, fallback 질문 사용: {}", exception.getMessage());
            return fallbackQuestion(jobRole);
        }
    }

    private String fallbackQuestion(String jobRole) {
        if (isFrontendRoleFamily(jobRole)) {
            return "지금 답변에서 렌더링 성능과 사용자 경험 관점을 더 구체적으로 설명해 주세요.";
        }
        return "지금 답변의 핵심 근거를 예시와 함께 더 구체적으로 설명해 주세요.";
    }

    private String normalizeQuestion(String generatedQuestion, String fallbackQuestion, String interviewerCharacter) {
        String normalized = generatedQuestion
                .replaceAll("^\\d+[\\.)]\\s*", "")
                .replaceAll("^질문\\s*[:：]\\s*", "")
                .replaceAll("^[-*•]+\\s*", "")
                .replaceAll("\\s+", " ")
                .trim();

        normalized = normalizePunctuation(normalized);
        normalized = applyPrefacePolicy(normalized, interviewerCharacter);
        normalized = rewriteAwkwardEnding(normalized);
        normalized = normalizePunctuation(normalized);

        if (normalized.isBlank()) {
            return fallbackQuestion;
        }

        if (!normalized.endsWith("?")) {
            normalized = normalized + "?";
        }
        return normalized;
    }

    private String normalizePunctuation(String sentence) {
        return sentence
                .replaceAll("\\s+([?.!,])", "$1")
                .replaceAll("([.!])\\?+", "?")
                .replaceAll("\\?+[.!]+", "?")
                .replaceAll("\\?{2,}", "?")
                .trim();
    }

    private String applyPrefacePolicy(String sentence, String interviewerCharacter) {
        int boundaryIndex = firstSentenceBoundary(sentence);
        if (boundaryIndex < 0) {
            return sentence;
        }
        String firstSentence = sentence.substring(0, boundaryIndex + 1).trim();
        if (!isPositivePreface(firstSentence)) {
            return sentence;
        }
        if (isLuna(interviewerCharacter)) {
            return sentence;
        }
        String remainder = sentence.substring(boundaryIndex + 1).trim();
        return remainder;
    }

    private int firstSentenceBoundary(String sentence) {
        int period = sentence.indexOf('.');
        int question = sentence.indexOf('?');
        int exclamation = sentence.indexOf('!');
        int index = -1;
        if (period >= 0) {
            index = period;
        }
        if (question >= 0 && (index < 0 || question < index)) {
            index = question;
        }
        if (exclamation >= 0 && (index < 0 || exclamation < index)) {
            index = exclamation;
        }
        return index;
    }

    private String rewriteAwkwardEnding(String sentence) {
        return sentence
                .replaceAll("해\\s*주시면\\s+도움이\\s+될\\s+것\\s+같습니다\\?$", "해 주실 수 있을까요?")
                .replaceAll("좋습니다\\?$", "좋을까요?")
                .replaceAll("같습니다\\?$", "같은가요?")
                .replaceAll("됩니다\\?$", "되나요?")
                .replaceAll("입니다\\?$", "인가요?")
                .replaceAll("([가-힣]+)습니다\\?$", "$1나요?");
    }

    private boolean isPositivePreface(String sentence) {
        String compact = sentence
                .replaceAll("[.!?]+$", "")
                .replaceAll("\\s+", " ")
                .trim();
        return compact.contains("좋은 답변")
                || compact.contains("좋은 설명")
                || compact.contains("좋은 시도")
                || compact.contains("감사");
    }

    private boolean isLuna(String interviewerCharacter) {
        if (interviewerCharacter == null) {
            return false;
        }
        return "luna".equals(interviewerCharacter.trim().toLowerCase(Locale.ROOT));
    }

    private boolean isFrontendRoleFamily(String jobRole) {
        if (jobRole == null) {
            return false;
        }
        return switch (jobRole.toLowerCase(Locale.ROOT)) {
            case "frontend", "app", "design", "pm" -> true;
            default -> false;
        };
    }
}
