package com.interviewmate.application.ai.usecase;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewmate.application.ai.port.AiChatPort;
import com.interviewmate.domain.ai.AnswerEvaluationResult;
import com.interviewmate.domain.ai.EvaluationWeights;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class EvaluateAnswerUseCase {

    private final AiChatPort aiChatPort;
    private final ObjectMapper objectMapper;

    @Autowired
    public EvaluateAnswerUseCase(AiChatPort aiChatPort, ObjectMapper objectMapper) {
        this.aiChatPort = aiChatPort;
        this.objectMapper = objectMapper;
    }

    EvaluateAnswerUseCase() {
        this.aiChatPort = null;
        this.objectMapper = new ObjectMapper();
    }

    public AnswerEvaluationResult execute(String question, String answer) {
        return execute(question, answer, "junior");
    }

    public AnswerEvaluationResult execute(String question, String answer, String difficulty) {
        AiEvaluationResult aiEvaluationResult = requestAiEvaluation(question, answer, difficulty);
        if (aiEvaluationResult != null) {
            return toEvaluationResult(aiEvaluationResult, difficulty);
        }
        return executeRuleBased(question, answer, difficulty);
    }

    private AnswerEvaluationResult executeRuleBased(String question, String answer, String difficulty) {
        String normalizedAnswer = answer == null ? "" : answer.trim();
        int answerLength = normalizedAnswer.length();

        double accuracy = calculateAccuracy(question, normalizedAnswer, answerLength);
        double logic = calculateLogic(normalizedAnswer, answerLength);
        double depth = calculateDepth(answerLength);
        double delivery = calculateDelivery(normalizedAnswer);

        EvaluationWeights weights = EvaluationWeights.defaultWeights();
        double weightedTotal = (accuracy * weights.getAccuracy()
                + logic * weights.getLogic()
                + depth * weights.getDepth()
                + delivery * weights.getDelivery()) / 100.0;

        double followupThreshold = resolveFollowupThreshold(difficulty);
        boolean followupRequired = weightedTotal < followupThreshold;
        String followupReason = followupRequired
                ? determineFollowupReasonDetail(accuracy, logic, depth)
                : "추가 꼬리질문 없이 다음 질문으로 진행 가능합니다.";

        return AnswerEvaluationResult.builder()
                .accuracy(roundOneDecimal(accuracy))
                .logic(roundOneDecimal(logic))
                .depth(roundOneDecimal(depth))
                .delivery(roundOneDecimal(delivery))
                .totalScore(roundOneDecimal(weightedTotal))
                .followupRequired(followupRequired)
                .followupReason(followupReason)
                .build();
    }

    private AiEvaluationResult requestAiEvaluation(String question, String answer, String difficulty) {
        if (aiChatPort == null || objectMapper == null) {
            return null;
        }
        try {
            return requestSingleAiEvaluation(question, answer, difficulty);
        } catch (Exception firstException) {
            log.warn("AI 평가 1차 실패, 재시도 진행: {}", firstException.getMessage());
            try {
                return requestSingleAiEvaluation(question, answer, difficulty);
            } catch (Exception retryException) {
                log.warn("AI 평가 재시도 실패, 규칙 기반 폴백 사용: {}", retryException.getMessage());
                return null;
            }
        }
    }

    private AiEvaluationResult requestSingleAiEvaluation(String question, String answer, String difficulty) throws Exception {
        String raw = aiChatPort.requestSingleResponse(buildSystemPrompt(), buildUserPrompt(question, answer, difficulty));
        return parseAiResponse(raw);
    }

    private String buildSystemPrompt() {
        return """
                당신은 한국어 기술 면접 답변 평가관입니다.
                반드시 JSON 객체만 반환하세요.
                필드:
                - accuracy: 1.0~5.0 숫자
                - logic: 1.0~5.0 숫자
                - depth: 1.0~5.0 숫자
                - delivery: 1.0~5.0 숫자
                - followup_required: true/false
                - followup_reason_detail_ko: 한국어 1~2문장
                """;
    }

    private String buildUserPrompt(String question, String answer, String difficulty) {
        return """
                난이도: %s
                질문: %s
                답변: %s

                평가 기준:
                1) 정확성(개념/용어 정확도)
                2) 논리성(결론-근거-예시 흐름)
                3) 깊이(핵심 원리/트레이드오프/실무 맥락)
                4) 전달력(명확성/문장 구성)

                followup_required는 꼬리질문이 필요할 때 true로 판단하세요.
                followup_reason_detail_ko는 실제로 바로 개선 가능한 한국어 조언으로 작성하세요.
                """.formatted(safe(difficulty), safe(question), safe(answer));
    }

    private AiEvaluationResult parseAiResponse(String rawText) throws Exception {
        if (rawText == null || rawText.isBlank()) {
            throw new IllegalArgumentException("AI 평가 응답이 비어있습니다.");
        }
        String cleaned = stripCodeFence(rawText);
        JsonNode root = objectMapper.readTree(cleaned);
        JsonNode payload = root.path("evaluation").isObject() ? root.path("evaluation") : root;

        double accuracy = payload.path("accuracy").asDouble(Double.NaN);
        double logic = payload.path("logic").asDouble(Double.NaN);
        double depth = payload.path("depth").asDouble(Double.NaN);
        double delivery = payload.path("delivery").asDouble(Double.NaN);

        if (!Double.isFinite(accuracy)
                || !Double.isFinite(logic)
                || !Double.isFinite(depth)
                || !Double.isFinite(delivery)) {
            throw new IllegalArgumentException("AI 평가 점수 형식이 유효하지 않습니다.");
        }

        boolean followupRequired = payload.path("followup_required").asBoolean(false);
        String reasonDetail = safe(payload.path("followup_reason_detail_ko").asText(""));
        if (reasonDetail.isBlank()) {
            reasonDetail = safe(payload.path("followup_reason").asText(""));
        }

        return new AiEvaluationResult(accuracy, logic, depth, delivery, followupRequired, reasonDetail);
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

    private AnswerEvaluationResult toEvaluationResult(AiEvaluationResult result, String difficulty) {
        double accuracy = clampScore(roundOneDecimal(result.accuracy()));
        double logic = clampScore(roundOneDecimal(result.logic()));
        double depth = clampScore(roundOneDecimal(result.depth()));
        double delivery = clampScore(roundOneDecimal(result.delivery()));

        EvaluationWeights weights = EvaluationWeights.defaultWeights();
        double weightedTotal = (accuracy * weights.getAccuracy()
                + logic * weights.getLogic()
                + depth * weights.getDepth()
                + delivery * weights.getDelivery()) / 100.0;
        double roundedTotal = roundOneDecimal(weightedTotal);

        boolean followupRequired = result.followupRequired();
        String followupReason = normalizeFollowupReason(result.followupReasonDetail(), followupRequired, accuracy, logic, depth, roundedTotal, difficulty);

        return AnswerEvaluationResult.builder()
                .accuracy(accuracy)
                .logic(logic)
                .depth(depth)
                .delivery(delivery)
                .totalScore(roundedTotal)
                .followupRequired(followupRequired)
                .followupReason(followupReason)
                .build();
    }

    private String normalizeFollowupReason(
            String reasonDetail,
            boolean followupRequired,
            double accuracy,
            double logic,
            double depth,
            double totalScore,
            String difficulty
    ) {
        String normalized = safe(reasonDetail);
        if (!normalized.isBlank()) {
            return normalized;
        }
        if (followupRequired) {
            return determineFollowupReasonDetail(accuracy, logic, depth);
        }
        double threshold = resolveFollowupThreshold(difficulty);
        if (totalScore >= threshold) {
            return "핵심 흐름은 안정적입니다. 다음 질문에서도 결론-근거-예시 구조를 유지해 주세요.";
        }
        return "핵심 개념과 근거를 조금 더 보강하면 좋겠습니다.";
    }

    private double clampScore(double value) {
        return Math.max(1.0, Math.min(5.0, value));
    }

    private double resolveFollowupThreshold(String difficulty) {
        if ("jobseeker".equalsIgnoreCase(difficulty)) {
            return 2.8;
        }
        return 3.2;
    }

    private double calculateAccuracy(String question, String answer, int answerLength) {
        if (answer.isBlank()) {
            return 1.0;
        }
        if (containsWeakSignal(answer)) {
            return 2.2;
        }

        double baseScore = answerLength > 120 ? 3.8 : 3.2;
        String lowerCaseQuestion = question == null ? "" : question.toLowerCase();
        boolean acidQuestion = lowerCaseQuestion.contains("acid");
        List<String> coreKeywords = extractCoreKeywords(question);
        if (coreKeywords.isEmpty()) {
            return baseScore;
        }

        int matchedKeywords = 0;
        String lowerCaseAnswer = answer.toLowerCase();
        for (String keyword : coreKeywords) {
            if (lowerCaseAnswer.contains(keyword)) {
                matchedKeywords += 1;
            }
        }

        if (acidQuestion && matchedKeywords < 2 && answerLength >= 80) {
            return Math.max(1.0, baseScore - 1.0);
        }
        if (matchedKeywords == 0 && answerLength >= 80) {
            return Math.max(1.0, baseScore - 1.0);
        }
        if (matchedKeywords >= Math.max(1, coreKeywords.size() / 2)) {
            return Math.min(4.0, baseScore + 0.5);
        }
        return baseScore;
    }

    private double calculateLogic(String answer, int answerLength) {
        double baseScore;
        if (answerLength < 30) {
            baseScore = 1.8;
        } else if (answerLength < 80) {
            baseScore = 2.8;
        } else {
            baseScore = 3.6;
        }

        int connectorCount = countLogicalConnectors(answer);
        if (connectorCount >= 2) {
            return Math.min(4.0, baseScore + 0.3);
        }
        if (answerLength >= 80 && connectorCount == 0) {
            return Math.max(1.0, baseScore - 0.3);
        }
        return baseScore;
    }

    private double calculateDepth(int answerLength) {
        if (answerLength < 40) {
            return 1.6;
        }
        if (answerLength < 100) {
            return 2.9;
        }
        return 3.7;
    }

    private double calculateDelivery(String answer) {
        if (answer.isBlank()) {
            return 1.0;
        }
        return answer.contains(".") || answer.contains(",") ? 3.5 : 2.8;
    }

    private boolean containsWeakSignal(String answer) {
        String lowerCaseAnswer = answer.toLowerCase();
        return lowerCaseAnswer.contains("잘 모르")
                || lowerCaseAnswer.contains("기억이 안")
                || lowerCaseAnswer.contains("아마")
                || lowerCaseAnswer.contains("대충");
    }

    private List<String> extractCoreKeywords(String question) {
        String lowerCaseQuestion = question == null ? "" : question.toLowerCase();
        List<String> keywords = new ArrayList<>();

        if (lowerCaseQuestion.contains("acid")) {
            keywords.add("acid");
            keywords.add("원자성");
            keywords.add("일관성");
            keywords.add("격리");
            keywords.add("지속성");
            return keywords;
        }

        if (lowerCaseQuestion.contains("캐시")) {
            keywords.add("캐시");
            keywords.add("무효화");
            keywords.add("만료");
        } else if (lowerCaseQuestion.contains("트랜잭션")) {
            keywords.add("트랜잭션");
            keywords.add("격리");
            keywords.add("커밋");
            keywords.add("롤백");
        } else if (lowerCaseQuestion.contains("인덱스")) {
            keywords.add("인덱스");
            keywords.add("조회");
            keywords.add("실행 계획");
        } else if (lowerCaseQuestion.contains("rest")) {
            keywords.add("리소스");
            keywords.add("메서드");
            keywords.add("상태코드");
        }
        return keywords;
    }

    private int countLogicalConnectors(String answer) {
        String lowerCaseAnswer = answer == null ? "" : answer.toLowerCase();
        int count = 0;
        String[] connectors = {"첫째", "둘째", "셋째", "따라서", "즉", "결론", "왜냐"};
        for (String connector : connectors) {
            if (lowerCaseAnswer.contains(connector)) {
                count += 1;
            }
        }
        return count;
    }

    private String determineFollowupReasonDetail(double accuracy, double logic, double depth) {
        if (accuracy <= logic && accuracy <= depth) {
            return "핵심 개념 정확도가 낮습니다. 용어 정의를 먼저 말하고 근거를 덧붙여 설명해 주세요.";
        }
        if (depth <= logic) {
            return "핵심 디테일이 부족합니다. 동작 원리와 실무 예시를 한 문장씩 추가해 주세요.";
        }
        return "논리 전개가 약합니다. 결론-근거-예시 순서로 답변을 재구성해 주세요.";
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private record AiEvaluationResult(
            double accuracy,
            double logic,
            double depth,
            double delivery,
            boolean followupRequired,
            String followupReasonDetail
    ) {
    }
}
