package com.interviewmate.application.ai.usecase;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewmate.application.ai.prompt.InterviewerToneGuide;
import com.interviewmate.application.ai.port.AiChatPort;
import com.interviewmate.domain.ai.AnswerEvaluationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerateRealtimeCoachingUseCase {

    private final AiChatPort aiChatPort;
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
                              "coaching": "다음 답변에서 바로 적용할 개선 액션 1문장"
                            }
                            summary/coaching은 각각 1문장, 한국어, 80자 이내로 작성하세요.
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
            return parseCoachingResult(generated);
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
