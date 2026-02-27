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

    private static final List<String> FRONTEND_JOB_EASY_TEMPLATES = List.of(
            "%s에서 props와 state의 역할 차이를 예시와 함께 설명해보세요.",
            "%s 프로젝트에서 useEffect를 사용하는 대표 상황을 한 가지 설명해보세요.",
            "%s 화면에서 폼 입력 유효성 검증을 어디에서 처리할지 설명해보세요."
    );
    private static final List<String> FRONTEND_JOB_MEDIUM_TEMPLATES = List.of(
            "%s 프로젝트에서 상태를 로컬/전역/서버 상태로 분리하는 기준을 설명해보세요.",
            "%s 화면에서 로딩/에러/빈 상태를 설계할 때 UX 기준을 설명해보세요.",
            "%s 코드베이스에서 재사용 가능한 컴포넌트 설계 기준을 설명해보세요."
    );
    private static final List<String> FRONTEND_JOB_HARD_TEMPLATES = List.of(
            "%s 환경에서 화면 성능 저하가 발생했을 때 병목을 찾는 진단 순서와 개선 우선순위를 설명해보세요.",
            "%s 앱에서 네트워크 지연이 큰 상황을 가정하고 UX 저하를 줄이기 위한 데이터 로딩 전략을 설명해보세요.",
            "%s 기반 모바일 앱에서 플랫폼별 동작 차이를 줄이기 위해 공통 계층을 설계하는 기준을 설명해보세요."
    );

    private static final List<String> FRONTEND_CS_EASY_TEMPLATES = List.of(
            "%s에서 브라우저 렌더링 과정이 사용자 체감 속도에 미치는 영향을 설명해보세요.",
            "%s 서비스에서 이벤트 루프와 비동기 처리의 기본 흐름을 설명해보세요.",
            "%s에서 캐시를 사용하면 좋은 상황과 주의할 점을 설명해보세요."
    );
    private static final List<String> FRONTEND_CS_MEDIUM_TEMPLATES = List.of(
            "%s 관점에서 렌더링 성능 병목을 진단할 때 확인하는 지표와 우선순위를 설명해보세요.",
            "%s 앱에서 브라우저 이벤트 루프와 비동기 처리 흐름이 UX에 미치는 영향을 설명해보세요.",
            "%s 기반 서비스에서 캐시 전략(메모리/네트워크)을 선택할 때 일관성과 응답속도 사이의 트레이드오프를 설명해보세요."
    );
    private static final List<String> FRONTEND_CS_HARD_TEMPLATES = List.of(
            "%s 앱에서 대규모 상태 업데이트가 발생할 때 렌더링 비용을 측정하고 줄이는 전략을 설명해보세요.",
            "%s 서비스에서 코드 스플리팅과 프리로딩 전략을 함께 설계할 때의 기준을 설명해보세요.",
            "%s 프로젝트에서 런타임 성능 추적 지표를 기반으로 개선 우선순위를 정하는 방법을 설명해보세요."
    );

    private static final List<String> BACKEND_JOB_EASY_TEMPLATES = List.of(
            "%s에서 트랜잭션이 꼭 필요한 상황을 한 가지 예로 설명해보세요.",
            "%s API에서 상태코드를 선택할 때 지켜야 할 기본 원칙을 설명해보세요.",
            "%s 서비스에서 예외 처리를 공통화해야 하는 이유를 설명해보세요."
    );
    private static final List<String> BACKEND_JOB_MEDIUM_TEMPLATES = List.of(
            "%s 기반 서비스에서 장애 대응을 위해 API/DB/캐시를 어떻게 계층적으로 설계하는지 설명해보세요.",
            "%s 환경에서 트래픽 급증 시 병목 지점을 파악하고 확장 전략을 선택하는 기준을 설명해보세요.",
            "%s 프로젝트에서 도메인 분리와 트랜잭션 경계를 설계할 때 고려해야 할 기준을 설명해보세요."
    );
    private static final List<String> BACKEND_JOB_HARD_TEMPLATES = List.of(
            "%s 서비스에서 배포 중 무중단을 보장하기 위한 아키텍처 전략을 설명해보세요.",
            "%s 기반 시스템에서 장애 복구 시간을 줄이기 위한 모니터링/알림 체계 설계 기준을 설명해보세요.",
            "%s 기반 시스템에서 읽기/쓰기 분리와 캐시 정합성을 함께 설계하는 기준을 설명해보세요."
    );

    private static final List<String> BACKEND_CS_EASY_TEMPLATES = List.of(
            "%s 환경에서 동시성 문제가 발생하는 대표적인 상황을 설명해보세요.",
            "%s에서 인덱스를 사용하는 이유와 기대 효과를 설명해보세요.",
            "%s에서 REST와 RPC의 차이를 간단히 설명해보세요."
    );
    private static final List<String> BACKEND_CS_MEDIUM_TEMPLATES = List.of(
            "%s 환경에서 트랜잭션 격리 수준과 동시성 이슈를 어떻게 점검하고 선택하는지 설명해보세요.",
            "%s 기반 시스템에서 큐 기반 비동기 처리와 동기 호출을 구분해 설계하는 기준을 설명해보세요.",
            "%s 서비스에서 캐시 전략을 선택할 때 정합성과 성능의 균형을 맞추는 방법을 설명해보세요."
    );
    private static final List<String> BACKEND_CS_HARD_TEMPLATES = List.of(
            "%s 기반 시스템에서 분산 락/낙관적 락/비관적 락을 선택하는 기준을 설명해보세요.",
            "%s 서비스에서 고가용성을 위한 장애 전파 차단 전략을 설명해보세요.",
            "%s 환경에서 트랜잭션 경계와 메시지 브로커를 조합해 정합성을 지키는 방법을 설명해보세요."
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
        String roleFamily = resolveRoleFamily(jobRole);
        String difficultyGuide = buildDifficultyGuide(difficulty);
        return """
                직무: %s
                직무군: %s
                기술스택: %s
                지원자 난이도: %s
                요구사항:
                1) 같은 질문을 반복하지 않는다.
                2) 답변자가 짧게 답하면 꼬리질문으로 확장 가능한 질문으로 작성한다.
                3) 모든 질문 본문에 기술스택 문자열 중 최소 1개를 그대로 포함한다.
                4) 첫 질문은 기술스택 기반의 실무 시나리오 질문으로 작성한다.
                5) 같은 설정이어도 매 세션 질문 구성이 달라지도록 다양한 소재를 섞는다.
                6) 난이도 가이드: %s
                """.formatted(jobRole, roleFamily, normalizedStack, difficulty, difficultyGuide);
    }

    private String buildDifficultyGuide(String difficulty) {
        if ("junior".equalsIgnoreCase(difficulty)) {
            return "실무 판단과 트레이드오프를 포함하되, 과도한 이론만 묻지 않는다.";
        }
        return "기초 개념과 기본 원리 중심으로 묻고, 대규모 아키텍처/고급 튜닝 심화 질문은 피한다.";
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

        if (normalized.size() < requiredCount) {
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
        }

        return applyDifficultyProfile(normalized, difficulty);
    }

    private List<GeneratedQuestion> applyDifficultyProfile(List<GeneratedQuestion> questions, String requestedDifficulty) {
        if (questions.isEmpty()) {
            return questions;
        }

        List<String> profile = buildDifficultyProfile(requestedDifficulty, questions.size());
        List<GeneratedQuestion> adjusted = new ArrayList<>(questions.size());
        for (int index = 0; index < questions.size(); index++) {
            GeneratedQuestion current = questions.get(index);
            adjusted.add(new GeneratedQuestion(current.category(), profile.get(index), current.content()));
        }
        return adjusted;
    }

    private List<String> buildDifficultyProfile(String requestedDifficulty, int questionCount) {
        List<String> profile = new ArrayList<>(questionCount);
        boolean junior = "junior".equalsIgnoreCase(requestedDifficulty);
        int primaryCount = junior
                ? Math.max(1, Math.round(questionCount * 0.57f))
                : Math.max(1, Math.round(questionCount * 0.71f));
        primaryCount = Math.min(primaryCount, questionCount);

        for (int index = 0; index < questionCount; index++) {
            if (junior) {
                profile.add(index < primaryCount ? "medium" : "hard");
            } else {
                profile.add(index < primaryCount ? "easy" : "medium");
            }
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

    private String normalizeDifficulty(String difficulty, String requestedDifficulty) {
        String value = difficulty == null ? "" : difficulty.trim().toLowerCase(Locale.ROOT);
        if (!("easy".equals(value) || "medium".equals(value) || "hard".equals(value))) {
            return "junior".equalsIgnoreCase(requestedDifficulty) ? "medium" : "easy";
        }

        if ("jobseeker".equalsIgnoreCase(requestedDifficulty) && "hard".equals(value)) {
            return "medium";
        }
        if ("junior".equalsIgnoreCase(requestedDifficulty) && "easy".equals(value)) {
            return "medium";
        }

        return value;
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
        String roleFamily = resolveRoleFamily(jobRole);
        String normalizedStack = normalizeStackLabel(stack);
        int fallbackOffset = ThreadLocalRandom.current().nextInt(0, 10_000);
        List<String> difficultyProfile = buildDifficultyProfile(difficulty, requiredCount);

        int jobTarget = Math.max(1, Math.min(requiredCount, Math.round(requiredCount * 0.7f)));
        for (int index = 1; index <= requiredCount; index++) {
            String category = index <= jobTarget ? "job" : "cs";
            String level = difficultyProfile.get(index - 1);
            String content = buildFallbackContent(roleFamily, normalizedStack, category, level, index, fallbackOffset);
            fallback.add(new GeneratedQuestion(category, level, content));
        }
        return fallback;
    }

    private String resolveRoleFamily(String jobRole) {
        String normalizedRole = jobRole == null ? "" : jobRole.trim().toLowerCase(Locale.ROOT);
        return switch (normalizedRole) {
            case "backend", "cloud", "data" -> "backend";
            case "frontend", "app", "design", "pm" -> "frontend";
            default -> "backend";
        };
    }

    private String buildFallbackContent(String roleFamily, String stack, String category, String difficulty, int index, int seedOffset) {
        List<String> templates = pickTemplates(roleFamily, category, difficulty);
        return pickTemplate(templates, index, seedOffset).formatted(stack);
    }

    private List<String> pickTemplates(String roleFamily, String category, String difficulty) {
        if ("frontend".equals(roleFamily)) {
            if ("cs".equals(category)) {
                return switch (difficulty) {
                    case "easy" -> FRONTEND_CS_EASY_TEMPLATES;
                    case "hard" -> FRONTEND_CS_HARD_TEMPLATES;
                    default -> FRONTEND_CS_MEDIUM_TEMPLATES;
                };
            }
            return switch (difficulty) {
                case "easy" -> FRONTEND_JOB_EASY_TEMPLATES;
                case "hard" -> FRONTEND_JOB_HARD_TEMPLATES;
                default -> FRONTEND_JOB_MEDIUM_TEMPLATES;
            };
        }

        if ("cs".equals(category)) {
            return switch (difficulty) {
                case "easy" -> BACKEND_CS_EASY_TEMPLATES;
                case "hard" -> BACKEND_CS_HARD_TEMPLATES;
                default -> BACKEND_CS_MEDIUM_TEMPLATES;
            };
        }

        return switch (difficulty) {
            case "easy" -> BACKEND_JOB_EASY_TEMPLATES;
            case "hard" -> BACKEND_JOB_HARD_TEMPLATES;
            default -> BACKEND_JOB_MEDIUM_TEMPLATES;
        };
    }

    private String pickTemplate(List<String> templates, int index, int seedOffset) {
        int resolvedIndex = Math.floorMod(seedOffset + index - 1, templates.size());
        return templates.get(resolvedIndex);
    }

    public record GeneratedQuestion(String category, String difficulty, String content) {
    }
}
