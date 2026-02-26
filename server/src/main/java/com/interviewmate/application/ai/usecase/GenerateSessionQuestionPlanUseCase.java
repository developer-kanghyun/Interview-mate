package com.interviewmate.application.ai.usecase;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewmate.application.ai.port.AiChatPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerateSessionQuestionPlanUseCase {

    private static final int DEFAULT_QUESTION_COUNT = 7;

    private final AiChatPort aiChatPort;
    private final ObjectMapper objectMapper;

    public List<GeneratedQuestion> execute(String jobRole, String stack, String difficulty, int questionCount) {
        int requiredCount = questionCount <= 0 ? DEFAULT_QUESTION_COUNT : questionCount;
        try {
            String generated = aiChatPort.requestSingleResponse(buildSystemPrompt(requiredCount), buildUserPrompt(jobRole, stack, difficulty));
            List<GeneratedQuestion> parsed = parseQuestions(generated);
            return normalizeQuestions(parsed, jobRole, stack, difficulty, requiredCount);
        } catch (Exception exception) {
            log.warn("세션 질문 플랜 생성 실패, fallback 플랜 사용: {}", exception.getMessage());
            return fallbackQuestions(jobRole, stack, difficulty, requiredCount);
        }
    }

    private String buildSystemPrompt(int questionCount) {
        return """
                당신은 한국어 기술 면접 질문 설계자입니다.
                반드시 JSON 배열만 반환하세요. 각 원소는 category, difficulty, content 필드를 가진 객체여야 합니다.
                category는 job 또는 cs만 허용합니다.
                difficulty는 easy, medium, hard 중 하나여야 합니다.
                총 %d개의 질문을 생성하세요.
                """.formatted(questionCount);
    }

    private String buildUserPrompt(String jobRole, String stack, String difficulty) {
        return """
                직무: %s
                기술스택: %s
                지원자 난이도: %s
                요구사항:
                1) 실제 면접처럼 핵심 개념 + 실무 판단을 묻는다.
                2) 같은 질문을 반복하지 않는다.
                3) 답변자가 짧게 답하면 꼬리질문으로 확장 가능한 질문으로 작성한다.
                """.formatted(jobRole, stack, difficulty);
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
            String jobRole,
            String stack,
            String difficulty,
            int requiredCount
    ) {
        List<GeneratedQuestion> normalized = new ArrayList<>();
        Set<String> dedupe = new LinkedHashSet<>();

        for (GeneratedQuestion item : parsed) {
            String content = normalizeContent(item.content());
            if (content.isBlank()) {
                continue;
            }
            if (!dedupe.add(content.toLowerCase(Locale.ROOT))) {
                continue;
            }
            normalized.add(new GeneratedQuestion(
                    normalizeCategory(item.category()),
                    normalizeDifficulty(item.difficulty(), difficulty),
                    content
            ));
            if (normalized.size() >= requiredCount) {
                break;
            }
        }

        if (normalized.size() >= requiredCount) {
            return normalized;
        }

        List<GeneratedQuestion> fallback = fallbackQuestions(jobRole, stack, difficulty, requiredCount);
        for (GeneratedQuestion item : fallback) {
            if (normalized.size() >= requiredCount) {
                break;
            }
            String key = item.content().toLowerCase(Locale.ROOT);
            if (dedupe.add(key)) {
                normalized.add(item);
            }
        }
        return normalized;
    }

    private String normalizeCategory(String category) {
        String value = category == null ? "" : category.trim().toLowerCase(Locale.ROOT);
        if ("cs".equals(value)) {
            return "cs";
        }
        return "job";
    }

    private String normalizeDifficulty(String difficulty, String requestedDifficulty) {
        String value = difficulty == null ? "" : difficulty.trim().toLowerCase(Locale.ROOT);
        if ("easy".equals(value) || "medium".equals(value) || "hard".equals(value)) {
            return value;
        }
        if ("junior".equalsIgnoreCase(requestedDifficulty)) {
            return "hard";
        }
        return "medium";
    }

    private String normalizeContent(String content) {
        if (content == null) {
            return "";
        }
        return content
                .replaceAll("^\\d+[\\.)]\\s*", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private List<GeneratedQuestion> fallbackQuestions(String jobRole, String stack, String difficulty, int requiredCount) {
        List<GeneratedQuestion> fallback = new ArrayList<>();
        String normalizedRole = jobRole == null ? "backend" : jobRole.trim().toLowerCase(Locale.ROOT);
        String normalizedStack = stack == null || stack.isBlank() ? "기본 스택" : stack.trim();
        String normalizedDifficulty = "junior".equalsIgnoreCase(difficulty) ? "junior" : "jobseeker";

        int jobTarget = Math.max(1, Math.min(requiredCount, Math.round(requiredCount * 0.7f)));
        for (int index = 1; index <= requiredCount; index++) {
            String category = index <= jobTarget ? "job" : "cs";
            String level = "jobseeker".equals(normalizedDifficulty) ? (index <= 3 ? "easy" : "medium") : (index <= 3 ? "medium" : "hard");
            String content = buildFallbackContent(normalizedRole, normalizedStack, category, index);
            fallback.add(new GeneratedQuestion(category, level, content));
        }
        return fallback;
    }

    private String buildFallbackContent(String role, String stack, String category, int index) {
        if ("frontend".equals(role)) {
            if ("cs".equals(category)) {
                return "%s 관점에서 렌더링 성능 병목을 진단할 때 확인하는 지표와 우선순위를 설명해보세요. (%d)".formatted(stack, index);
            }
            return "%s 프로젝트에서 상태 관리 구조를 설계할 때 전역/서버/로컬 상태를 분리하는 기준을 설명해보세요. (%d)".formatted(stack, index);
        }

        if ("cs".equals(category)) {
            return "%s 환경에서 트랜잭션 격리 수준과 동시성 이슈를 어떻게 점검하고 선택하는지 설명해보세요. (%d)".formatted(stack, index);
        }
        return "%s 기반 서비스에서 장애 대응을 위해 API/DB/캐시를 어떻게 계층적으로 설계하는지 설명해보세요. (%d)".formatted(stack, index);
    }

    public record GeneratedQuestion(String category, String difficulty, String content) {
    }
}
