package com.interviewmate.application.ai.usecase;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewmate.application.ai.prompt.InterviewerToneGuide;
import com.interviewmate.application.ai.port.AiChatCompletionPort;
import com.interviewmate.domain.ai.AnswerEvaluationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerateRealtimeCoachingUseCase {

    private final AiChatCompletionPort aiChatPort;
    private final ObjectMapper objectMapper;

    public RealtimeCoachingResult execute(
            String jobRole,
            String stack,
            String difficulty,
            String question,
            String answer,
            AnswerEvaluationResult evaluationResult,
            String followupReason,
            String interviewerCharacter
    ) {
        try {
            String generated = aiChatPort.requestSingleResponse(
                    """
                            당신은 실시간 기술 면접 코치입니다.
                            %s
                            반드시 JSON 객체로만 응답하세요.
                            형식:
                            {
                              "summary": "현재 답변 상태를 1문장으로 요약",
                              "coaching": "다음 답변에서 바로 적용할 개선 가이드 + 예시 답변"
                            }
                            작성 규칙:
                            - summary는 1문장, 한국어, 80자 이내.
                            - coaching에는 반드시 아래 두 요소를 모두 포함:
                              1) '이렇게 답하세요:'로 시작하는 구조 가이드 1문장
                              2) '예시 답변:'으로 시작하는 구체 예시 1~2문장
                            - 추상적인 표현(예: "구체적으로", "보완하세요")만 단독으로 쓰지 마세요.
                            """.formatted(InterviewerToneGuide.forRealtimeCoaching(interviewerCharacter)),
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
            return enrichCoachingResult(parseCoachingResult(generated), question, stack);
        } catch (Exception exception) {
            log.warn("실시간 코칭 생성 실패, 코칭 비활성 응답 사용: {}", exception.getMessage());
            return RealtimeCoachingResult.unavailable();
        }
    }

    private RealtimeCoachingResult parseCoachingResult(String generated) {
        if (generated == null || generated.isBlank()) {
            return RealtimeCoachingResult.unavailable();
        }

        String normalized = stripCodeFence(generated);
        if (normalized.startsWith("{") && normalized.endsWith("}")) {
            try {
                JsonNode node = objectMapper.readTree(normalized);
                String summary = normalizeSentence(node.path("summary").asText(""));
                String coaching = normalizeSentence(node.path("coaching").asText(""));
                if (summary == null && coaching == null) {
                    return RealtimeCoachingResult.unavailable();
                }
                return new RealtimeCoachingResult(summary, coaching, true);
            } catch (Exception exception) {
                log.debug("코칭 JSON 파싱 실패, 텍스트 파싱으로 전환: {}", exception.getMessage());
            }
        }

        String[] lines = normalized.split("\\r?\\n");
        String summary = null;
        String coaching = null;
        for (String line : lines) {
            String candidate = normalizeSentence(line);
            if (candidate == null) {
                continue;
            }
            if (summary == null) {
                summary = candidate;
                continue;
            }
            coaching = candidate;
            break;
        }

        if (summary == null && coaching == null) {
            return RealtimeCoachingResult.unavailable();
        }
        return new RealtimeCoachingResult(summary, coaching, true);
    }

    private String normalizeSentence(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value
                .replaceAll("^[-*•]+\\s*", "")
                .replaceAll("^\\d+[\\.)]\\s*", "")
                .replaceAll("\\s+", " ")
                .trim();
        if (normalized.isBlank()) {
            return null;
        }
        return normalized;
    }

    private String stripCodeFence(String value) {
        String trimmed = value.trim();
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

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private RealtimeCoachingResult enrichCoachingResult(
            RealtimeCoachingResult parsed,
            String question,
            String stack
    ) {
        if (!parsed.coachingAvailable()) {
            return parsed;
        }

        String coaching = normalizeSentence(parsed.coachingMessage());
        if (coaching == null) {
            return parsed;
        }

        boolean hasStructureGuide = coaching.contains("이렇게 답하세요:");
        boolean hasExampleAnswer = coaching.contains("예시 답변:");
        if (hasStructureGuide && hasExampleAnswer) {
            return parsed;
        }

        StringBuilder enriched = new StringBuilder();
        if (!hasStructureGuide) {
            enriched.append("이렇게 답하세요: 핵심 결론 -> 선택 이유 -> 적용 사례 순서로 2~3문장으로 답변하세요.");
            if (!coaching.isBlank()) {
                enriched.append(" ").append(coaching);
            }
        } else {
            enriched.append(coaching);
        }

        if (!hasExampleAnswer) {
            enriched.append(" ").append(buildExampleAnswerSnippet(question, stack));
        }

        return new RealtimeCoachingResult(
                parsed.feedbackSummary(),
                normalizeSentence(enriched.toString()),
                true
        );
    }

    private String buildExampleAnswerSnippet(String question, String stack) {
        String context = (safe(question) + " " + safe(stack)).toLowerCase(Locale.ROOT);

        if (context.contains("react") || context.contains("state") || context.contains("상태 관리")) {
            return "예시 답변: \"UI 상태는 useState로, 전역 상태는 Context로, 서버 상태는 React Query로 분리하고 staleTime 30초를 설정해 불필요한 재요청을 줄였습니다.\"";
        }
        if (context.contains("인증") || context.contains("oauth") || context.contains("jwt")) {
            return "예시 답변: \"로그인 성공 후 access token은 메모리에 두고 refresh token은 HttpOnly 쿠키에 저장하며, 401이 오면 재발급 후 원요청을 재시도하도록 구성했습니다.\"";
        }
        if (context.contains("트랜잭션") || context.contains("transaction")) {
            return "예시 답변: \"주문 생성과 재고 차감은 하나의 트랜잭션으로 묶고, 외부 알림 전송은 커밋 이후 비동기로 분리해 정합성과 성능을 함께 확보했습니다.\"";
        }

        return "예시 답변: \"핵심 결론을 먼저 말하고, 선택 이유 1개와 실제 적용 사례 1개를 이어서 설명했습니다.\"";
    }

    public record RealtimeCoachingResult(
            String feedbackSummary,
            String coachingMessage,
            boolean coachingAvailable
    ) {
        public static RealtimeCoachingResult unavailable() {
            return new RealtimeCoachingResult(null, null, false);
        }
    }
}
