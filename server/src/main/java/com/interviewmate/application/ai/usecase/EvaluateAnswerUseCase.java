package com.interviewmate.application.ai.usecase;

import com.interviewmate.domain.ai.AnswerEvaluationResult;
import com.interviewmate.domain.ai.EvaluationWeights;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EvaluateAnswerUseCase {

    public AnswerEvaluationResult execute(String question, String answer, String difficulty, String stack) {
        String normalizedAnswer = answer == null ? "" : answer.trim();
        int answerLength = normalizedAnswer.length();
        String normalizedDifficulty = normalizeDifficulty(difficulty);
        List<String> keywordPool = buildKeywordPool(question, stack);

        double accuracy = calculateAccuracy(normalizedAnswer, answerLength, normalizedDifficulty, keywordPool);
        double logic = calculateLogic(normalizedAnswer, answerLength, normalizedDifficulty);
        double depth = calculateDepth(answerLength, normalizedDifficulty);
        double delivery = calculateDelivery(normalizedAnswer, answerLength);

        EvaluationWeights weights = EvaluationWeights.defaultWeights();
        double weightedTotal = (accuracy * weights.getAccuracy()
                + logic * weights.getLogic()
                + depth * weights.getDepth()
                + delivery * weights.getDelivery()) / 100.0;

        double followupThreshold = "jobseeker".equals(normalizedDifficulty) ? 2.8 : 3.0;
        boolean followupRequired = weightedTotal < followupThreshold;
        String followupReason = followupRequired ? determineFollowupReason(accuracy, logic, depth) : "none";

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

    private double calculateAccuracy(String answer, int answerLength, String difficulty, List<String> keywordPool) {
        if (answer.isBlank()) {
            return 1.0;
        }

        double baseScore = resolveAccuracyBase(answerLength, difficulty);
        if (containsWeakSignal(answer)) {
            baseScore -= 0.6;
        }

        int matchedKeywords = countKeywordMatches(answer, keywordPool);
        if (matchedKeywords >= 2) {
            return clampScore(Math.max(baseScore, 3.5) + Math.min(0.3, (matchedKeywords - 2) * 0.1));
        }
        if (matchedKeywords == 1) {
            return clampScore(Math.max(baseScore, 3.0));
        }
        if (answerLength >= 120) {
            baseScore -= 0.2;
        }
        return clampScore(baseScore);
    }

    private double resolveAccuracyBase(int answerLength, String difficulty) {
        if ("jobseeker".equals(difficulty)) {
            if (answerLength < 25) {
                return 2.0;
            }
            if (answerLength < 60) {
                return 2.6;
            }
            if (answerLength < 120) {
                return 3.0;
            }
            return 3.2;
        }

        if (answerLength < 25) {
            return 1.8;
        }
        if (answerLength < 60) {
            return 2.4;
        }
        if (answerLength < 120) {
            return 2.9;
        }
        return 3.2;
    }

    private double calculateLogic(String answer, int answerLength, String difficulty) {
        double baseScore;

        if ("jobseeker".equals(difficulty)) {
            if (answerLength < 30) {
                baseScore = 2.2;
            } else if (answerLength < 80) {
                baseScore = 2.9;
            } else {
                baseScore = 3.4;
            }
        } else {
            if (answerLength < 30) {
                baseScore = 2.0;
            } else if (answerLength < 80) {
                baseScore = 2.7;
            } else {
                baseScore = 3.4;
            }
        }

        int connectorCount = countLogicalConnectors(answer);
        if ("jobseeker".equals(difficulty) && connectorCount >= 1) {
            return clampScore(baseScore + 0.3);
        }
        if (!"jobseeker".equals(difficulty) && connectorCount >= 2) {
            return clampScore(baseScore + 0.3);
        }
        if (!"jobseeker".equals(difficulty) && answerLength >= 90 && connectorCount == 0) {
            return clampScore(baseScore - 0.2);
        }
        return clampScore(baseScore);
    }

    private double calculateDepth(int answerLength, String difficulty) {
        if ("jobseeker".equals(difficulty)) {
            if (answerLength < 40) {
                return 2.2;
            }
            if (answerLength < 100) {
                return 3.0;
            }
            return 3.5;
        }

        if (answerLength < 40) {
            return 1.8;
        }
        if (answerLength < 100) {
            return 2.8;
        }
        return 3.6;
    }

    private double calculateDelivery(String answer, int answerLength) {
        if (answer.isBlank()) {
            return 1.0;
        }
        double score = answer.contains(".") || answer.contains(",") ? 3.4 : 2.9;
        if (answerLength >= 100 && countLogicalConnectors(answer) >= 1) {
            score += 0.2;
        }
        return clampScore(score);
    }

    private boolean containsWeakSignal(String answer) {
        String lowerCaseAnswer = answer.toLowerCase();
        return lowerCaseAnswer.contains("잘 모르")
                || lowerCaseAnswer.contains("기억이 안")
                || lowerCaseAnswer.contains("아마")
                || lowerCaseAnswer.contains("대충");
    }

    private List<String> buildKeywordPool(String question, String stack) {
        Set<String> keywords = new LinkedHashSet<>();
        keywords.addAll(extractCoreKeywords(question));
        keywords.addAll(parseStackKeywords(stack));
        return new ArrayList<>(keywords);
    }

    private List<String> parseStackKeywords(String stack) {
        if (stack == null || stack.isBlank()) {
            return List.of();
        }
        return Arrays.stream(stack.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toList());
    }

    private int countKeywordMatches(String answer, List<String> keywords) {
        if (keywords.isEmpty()) {
            return 0;
        }
        String lowerCaseAnswer = answer.toLowerCase(Locale.ROOT);
        int matched = 0;
        for (String keyword : keywords) {
            String normalizedKeyword = keyword.toLowerCase(Locale.ROOT).trim();
            if (!normalizedKeyword.isBlank() && lowerCaseAnswer.contains(normalizedKeyword)) {
                matched += 1;
            }
        }
        return matched;
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

    private String normalizeDifficulty(String difficulty) {
        if ("junior".equalsIgnoreCase(difficulty)) {
            return "junior";
        }
        return "jobseeker";
    }

    private String determineFollowupReason(double accuracy, double logic, double depth) {
        if (accuracy <= logic && accuracy <= depth) {
            return "factual_error_or_uncertainty";
        }
        if (depth <= logic) {
            return "missing_core_detail";
        }
        return "weak_reasoning";
    }

    private double clampScore(double value) {
        return Math.max(1.0, Math.min(4.0, value));
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
