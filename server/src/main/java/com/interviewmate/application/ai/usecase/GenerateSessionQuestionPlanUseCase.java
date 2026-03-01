package com.interviewmate.application.ai.usecase;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewmate.application.ai.port.AiChatCompletionPort;
import com.interviewmate.global.error.AppException;
import com.interviewmate.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerateSessionQuestionPlanUseCase {

    private static final int DEFAULT_QUESTION_COUNT = 7;
    private static final int MAX_GENERATION_ATTEMPTS = 3;

    private final AiChatCompletionPort aiChatPort;
    private final ObjectMapper objectMapper;

    public List<GeneratedQuestion> execute(String jobRole, String stack, String difficulty, int questionCount) {
        int requiredCount = questionCount <= 0 ? DEFAULT_QUESTION_COUNT : questionCount;
        String normalizedDifficulty = normalizeRequestedDifficulty(difficulty);
        String normalizedStack = normalizeStackLabel(stack);

        for (int attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
            try {
                String generated = aiChatPort.requestSingleResponse(
                        buildSystemPrompt(requiredCount),
                        buildUserPrompt(jobRole, normalizedStack, normalizedDifficulty)
                );

                List<GeneratedQuestion> parsed = parseQuestions(generated);
                List<GeneratedQuestion> normalized = normalizeQuestions(parsed, stack, requiredCount);
                if (normalized.size() == requiredCount) {
                    return applyDifficultyProfile(normalized, normalizedDifficulty);
                }
                log.warn("질문 생성 검증 실패: attempt={}, parsedSize={}, normalizedSize={}, requiredSize={}",
                        attempt, parsed.size(), normalized.size(), requiredCount);
            } catch (Exception exception) {
                log.warn("세션 질문 플랜 생성 실패: attempt={}, message={}", attempt, exception.getMessage());
            }
        }

        throw new AppException(
                ErrorCode.UPSTREAM_AI_UNAVAILABLE,
                "질문 생성이 지연되고 있습니다. 잠시 후 다시 시도해 주세요."
        );
    }

    private String buildSystemPrompt(int questionCount) {
        return """
                당신은 한국어 기술 면접 질문 설계자입니다.
                반드시 JSON 배열만 반환하세요. 각 원소는 category, difficulty, content 필드를 가진 객체여야 합니다.
                category는 job 또는 cs만 허용합니다.
                difficulty는 easy, medium, hard 중 하나여야 합니다.
                질문은 총 %d개 생성하세요.
                """.formatted(questionCount);
    }

    private String buildUserPrompt(String jobRole, String stack, String difficulty) {
        String difficultyGuide = "jobseeker".equals(difficulty)
                ? """
                난이도 가이드(jobseeker):
                - 기초 개념 정의와 핵심 원리 중심의 쉬운 질문으로 작성한다.
                - 짧은 실무 예시는 허용하되, 복잡한 아키텍처/분산 시스템 심화 질문은 피한다.
                - 과도한 압박형 질문은 금지한다.
                """
                : """
                난이도 가이드(junior):
                - 실무 맥락 질문을 포함하되, 난이도는 과도하게 높이지 않는다.
                - 개념 설명 + 선택 근거를 말할 수 있는 수준으로 작성한다.
                - 심화 최적화/극단적 장애 시나리오 질문은 제한한다.
                """;

        return """
                직무: %s
                기술스택: %s
                지원자 난이도: %s
                %s
                공통 요구사항:
                1) 모든 질문은 면접 질문 문장 1개만 작성한다.
                2) 같은 질문을 반복하지 않는다.
                3) 각 질문 본문에는 기술스택 문자열 중 최소 1개를 그대로 포함한다.
                4) 첫 질문은 기술스택 기반의 기본 실무 시나리오로 작성한다.
                5) 같은 설정이어도 질문이 반복되지 않도록 소재를 다양화한다.
                """.formatted(jobRole, stack, difficulty, difficultyGuide);
    }

    private List<GeneratedQuestion> parseQuestions(String rawText) throws Exception {
        if (rawText == null || rawText.isBlank()) {
            return List.of();
        }

        String cleaned = stripCodeFence(rawText);
        JsonNode root = objectMapper.readTree(cleaned);
        JsonNode questionArray = root;
        if (root.isObject() && root.has("questions")) {
            questionArray = root.get("questions");
        }
        if (!questionArray.isArray()) {
            return List.of();
        }

        List<GeneratedQuestion> parsed = new ArrayList<>();
        for (JsonNode node : questionArray) {
            parsed.add(new GeneratedQuestion(
                    node.path("category").asText("job"),
                    node.path("difficulty").asText("medium"),
                    node.path("content").asText("")
            ));
        }
        return parsed;
    }

    private String stripCodeFence(String rawText) {
        String trimmed = rawText.trim();
        if (!trimmed.startsWith("```")) {
            return trimmed;
        }
        int firstNewLine = trimmed.indexOf('\n');
        if (firstNewLine < 0) {
            return trimmed;
        }
        int lastFence = trimmed.lastIndexOf("```");
        if (lastFence <= firstNewLine) {
            return trimmed.substring(firstNewLine + 1).trim();
        }
        return trimmed.substring(firstNewLine + 1, lastFence).trim();
    }

    private List<GeneratedQuestion> normalizeQuestions(
            List<GeneratedQuestion> parsed,
            String stack,
            int requiredCount
    ) {
        List<GeneratedQuestion> normalized = new ArrayList<>();
        Set<String> dedupe = new LinkedHashSet<>();
        List<String> stackKeywords = parseStackKeywords(stack);

        for (GeneratedQuestion item : parsed) {
            String content = normalizeContent(item.content());
            if (content.isBlank()) {
                continue;
            }
            if (!isQuestionStackRelevant(content, stackKeywords)) {
                continue;
            }
            if (!dedupe.add(content.toLowerCase(Locale.ROOT))) {
                continue;
            }
            normalized.add(new GeneratedQuestion(
                    normalizeCategory(item.category()),
                    normalizeGeneratedDifficulty(item.difficulty()),
                    content
            ));

            if (normalized.size() >= requiredCount) {
                break;
            }
        }

        if (normalized.size() != requiredCount) {
            return List.of();
        }
        return normalized;
    }

    private List<GeneratedQuestion> applyDifficultyProfile(List<GeneratedQuestion> questions, String requestedDifficulty) {
        List<String> targetProfile = buildDifficultyProfile(requestedDifficulty, questions.size());
        List<GeneratedQuestion> adjusted = new ArrayList<>(questions.size());
        for (int index = 0; index < questions.size(); index++) {
            GeneratedQuestion question = questions.get(index);
            adjusted.add(new GeneratedQuestion(
                    question.category(),
                    targetProfile.get(index),
                    question.content()
            ));
        }
        return adjusted;
    }

    private List<String> buildDifficultyProfile(String requestedDifficulty, int size) {
        List<String> profile = new ArrayList<>(size);
        List<String> pattern = "jobseeker".equals(requestedDifficulty)
                ? List.of("easy", "easy", "easy", "medium", "easy", "medium", "easy")
                : List.of("easy", "medium", "hard", "medium", "easy", "hard", "medium");

        for (int index = 0; index < size; index++) {
            profile.add(pattern.get(index % pattern.size()));
        }
        return profile;
    }

    private String normalizeCategory(String category) {
        String value = category == null ? "" : category.trim().toLowerCase(Locale.ROOT);
        if ("cs".equals(value)) {
            return "cs";
        }
        return "job";
    }

    private String normalizeGeneratedDifficulty(String difficulty) {
        String value = difficulty == null ? "" : difficulty.trim().toLowerCase(Locale.ROOT);
        if ("easy".equals(value) || "medium".equals(value) || "hard".equals(value)) {
            return value;
        }
        return "medium";
    }

    private String normalizeRequestedDifficulty(String difficulty) {
        if ("junior".equalsIgnoreCase(difficulty)) {
            return "junior";
        }
        return "jobseeker";
    }

    private String normalizeContent(String content) {
        if (content == null) {
            return "";
        }
        String normalized = content
                .replaceAll("^\\d+[\\.)]\\s*", "")
                .replaceAll("^질문\\s*[:：]\\s*", "")
                .replaceAll("\\s+", " ")
                .replaceAll("\\s*\\(\\d+\\)$", "")
                .trim();
        if (!normalized.isBlank() && !normalized.endsWith("?")) {
            normalized = normalized + "?";
        }
        return normalized;
    }

    private String normalizeStackLabel(String stack) {
        List<String> keywords = parseStackKeywords(stack);
        if (keywords.isEmpty()) {
            return "기본 스택";
        }
        return String.join(", ", keywords);
    }

    private List<String> parseStackKeywords(String stack) {
        if (stack == null || stack.isBlank()) {
            return List.of();
        }
        return Arrays.stream(stack.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }

    private boolean isQuestionStackRelevant(String content, List<String> stackKeywords) {
        if (stackKeywords.isEmpty()) {
            return true;
        }
        String normalizedContent = content.toLowerCase(Locale.ROOT);
        for (String keyword : stackKeywords) {
            if (normalizedContent.contains(keyword.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    public record GeneratedQuestion(String category, String difficulty, String content) {
    }
}
