package com.interviewmate.application.ai.usecase;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewmate.application.ai.port.AiChatPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerateSessionQuestionPlanUseCase {

    private static final int DEFAULT_QUESTION_COUNT = 7;
    private static final List<String> FRONTEND_JOB_TEMPLATES = List.of(
            "%s 프로젝트에서 상태 관리 구조를 설계할 때 전역/서버/로컬 상태를 분리하는 기준을 설명해보세요. (%d)",
            "%s 환경에서 화면 성능 저하가 발생했을 때 병목을 찾는 진단 순서와 개선 우선순위를 설명해보세요. (%d)",
            "%s 코드베이스에서 컴포넌트 아키텍처를 설계할 때 재사용성과 유지보수성을 동시에 확보하는 기준을 설명해보세요. (%d)",
            "%s 앱에서 네트워크 지연이 큰 상황을 가정하고 UX 저하를 줄이기 위한 데이터 로딩 전략을 설명해보세요. (%d)"
    );
    private static final List<String> FRONTEND_CS_TEMPLATES = List.of(
            "%s 관점에서 렌더링 성능 병목을 진단할 때 확인하는 지표와 우선순위를 설명해보세요. (%d)",
            "%s 앱에서 브라우저 이벤트 루프와 비동기 처리 흐름이 UX에 미치는 영향을 설명해보세요. (%d)",
            "%s 기반 서비스에서 캐시 전략(메모리/네트워크)을 선택할 때 일관성과 응답속도 사이의 트레이드오프를 설명해보세요. (%d)"
    );
    private static final List<String> BACKEND_JOB_TEMPLATES = List.of(
            "%s 기반 서비스에서 장애 대응을 위해 API/DB/캐시를 어떻게 계층적으로 설계하는지 설명해보세요. (%d)",
            "%s 환경에서 트래픽 급증 시 병목 지점을 파악하고 확장 전략을 선택하는 기준을 설명해보세요. (%d)",
            "%s 프로젝트에서 도메인 분리와 트랜잭션 경계를 설계할 때 고려해야 할 기준을 설명해보세요. (%d)",
            "%s 서비스에서 배포 중 무중단을 보장하기 위한 아키텍처 전략을 설명해보세요. (%d)"
    );
    private static final List<String> BACKEND_CS_TEMPLATES = List.of(
            "%s 환경에서 트랜잭션 격리 수준과 동시성 이슈를 어떻게 점검하고 선택하는지 설명해보세요. (%d)",
            "%s 기반 시스템에서 분산 락/낙관적 락/비관적 락을 선택하는 기준을 설명해보세요. (%d)",
            "%s 서비스에서 큐 기반 비동기 처리와 동기 호출을 구분해 설계하는 기준을 설명해보세요. (%d)"
    );

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
        String normalizedStack = normalizeStackLabel(stack);
        return """
                직무: %s
                기술스택: %s
                지원자 난이도: %s
                요구사항:
                1) 실제 면접처럼 핵심 개념 + 실무 판단을 묻는다.
                2) 같은 질문을 반복하지 않는다.
                3) 답변자가 짧게 답하면 꼬리질문으로 확장 가능한 질문으로 작성한다.
                4) 모든 질문 본문에 기술스택 문자열 중 최소 1개를 그대로 포함한다.
                5) 첫 질문은 기술스택 기반의 실무 시나리오 질문으로 작성한다.
                6) 같은 설정이어도 매 세션 질문 구성이 달라지도록 다양한 소재를 섞는다.
                """.formatted(jobRole, normalizedStack, difficulty);
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

    private List<GeneratedQuestion> fallbackQuestions(String jobRole, String stack, String difficulty, int requiredCount) {
        List<GeneratedQuestion> fallback = new ArrayList<>();
        String normalizedRole = jobRole == null ? "backend" : jobRole.trim().toLowerCase(Locale.ROOT);
        String normalizedStack = normalizeStackLabel(stack);
        String normalizedDifficulty = "junior".equalsIgnoreCase(difficulty) ? "junior" : "jobseeker";
        int fallbackOffset = ThreadLocalRandom.current().nextInt(0, 10_000);

        int jobTarget = Math.max(1, Math.min(requiredCount, Math.round(requiredCount * 0.7f)));
        for (int index = 1; index <= requiredCount; index++) {
            String category = index <= jobTarget ? "job" : "cs";
            String level = "jobseeker".equals(normalizedDifficulty) ? (index <= 3 ? "easy" : "medium") : (index <= 3 ? "medium" : "hard");
            String content = buildFallbackContent(normalizedRole, normalizedStack, category, index, fallbackOffset);
            fallback.add(new GeneratedQuestion(category, level, content));
        }
        return fallback;
    }

    private String buildFallbackContent(String role, String stack, String category, int index, int seedOffset) {
        if ("frontend".equals(role)) {
            List<String> templates = "cs".equals(category) ? FRONTEND_CS_TEMPLATES : FRONTEND_JOB_TEMPLATES;
            return pickTemplate(templates, index, seedOffset).formatted(stack, index);
        }
        List<String> templates = "cs".equals(category) ? BACKEND_CS_TEMPLATES : BACKEND_JOB_TEMPLATES;
        return pickTemplate(templates, index, seedOffset).formatted(stack, index);
    }

    private String pickTemplate(List<String> templates, int index, int seedOffset) {
        int resolvedIndex = Math.floorMod(seedOffset + index - 1, templates.size());
        return templates.get(resolvedIndex);
    }

    public record GeneratedQuestion(String category, String difficulty, String content) {
    }
}
