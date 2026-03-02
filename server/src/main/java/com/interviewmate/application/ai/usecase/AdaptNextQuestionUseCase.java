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
            return normalizeQuestion(generated, baseQuestion, interviewerCharacter);
        } catch (Exception exception) {
            log.warn("다음 질문 보정 실패, 원본 질문 유지: {}", exception.getMessage());
            return baseQuestion;
        }
    }

    private String normalizeQuestion(String generated, String baseQuestion, String interviewerCharacter) {
        String normalized = generated
                .replaceAll("^\\d+[\\.)]\\s*", "")
                .replaceAll("^질문\\s*[:：]\\s*", "")
                .replaceAll("\\s+", " ")
                .trim();

        normalized = normalizePunctuation(normalized);
        normalized = applyPrefacePolicy(normalized, interviewerCharacter);
        normalized = rewriteAwkwardEnding(normalized);

        normalized = normalized
                .replaceAll("\\s+([?.!,])", "$1")
                .replaceAll("([.!])\\?+", "?")
                .replaceAll("\\?+[.!]+", "?")
                .replaceAll("\\?{2,}", "?");

        if (normalized.isBlank()) {
            return baseQuestion;
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
        return sentence.substring(boundaryIndex + 1).trim();
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
        return "luna".equalsIgnoreCase(interviewerCharacter.trim());
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
