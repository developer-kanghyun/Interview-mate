package com.interviewmate.application.ai.usecase;

import com.interviewmate.domain.ai.AnswerEvaluationResult;
import com.interviewmate.domain.ai.EvaluationWeights;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class EvaluateAnswerUseCase {

    public AnswerEvaluationResult execute(String question, String answer) {
        return execute(question, answer, "junior");
    }

    public AnswerEvaluationResult execute(String question, String answer, String difficulty) {
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

    private String determineFollowupReason(double accuracy, double logic, double depth) {
        if (accuracy <= logic && accuracy <= depth) {
            return "factual_error_or_uncertainty";
        }
        if (depth <= logic) {
            return "missing_core_detail";
        }
        return "weak_reasoning";
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
