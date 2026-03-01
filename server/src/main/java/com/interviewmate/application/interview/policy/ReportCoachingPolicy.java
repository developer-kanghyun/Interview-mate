package com.interviewmate.application.interview.policy;

import com.interviewmate.domain.ai.AnswerEvaluationResult;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class ReportCoachingPolicy {

    public List<String> extractWeakPoints(AnswerEvaluationResult result) {
        List<String> weakPoints = new ArrayList<>();
        if (result.getAccuracy() < 3.2) {
            weakPoints.add("정확성");
        }
        if (result.getLogic() < 3.2) {
            weakPoints.add("논리성");
        }
        if (result.getDepth() < 3.2) {
            weakPoints.add("깊이");
        }
        if (result.getDelivery() < 3.2) {
            weakPoints.add("전달력");
        }
        return weakPoints;
    }

    public List<String> extractWeakConceptKeywords(List<String> weakPoints, String followupReason) {
        List<String> keywords = new ArrayList<>();
        for (String weakPoint : weakPoints) {
            if ("정확성".equals(weakPoint)) {
                keywords.add("핵심 개념 정의");
                keywords.add("용어 정확도");
            }
            if ("논리성".equals(weakPoint)) {
                keywords.add("근거-결론 연결");
                keywords.add("원인-결과 구조");
            }
            if ("깊이".equals(weakPoint)) {
                keywords.add("트레이드오프");
                keywords.add("실무 사례");
            }
            if ("전달력".equals(weakPoint)) {
                keywords.add("문장 구조화");
                keywords.add("요약 전달");
            }
        }

        if ("factual_error_or_uncertainty".equals(followupReason)) {
            keywords.add("사실 검증");
        }
        if ("missing_core_detail".equals(followupReason)) {
            keywords.add("핵심 세부사항");
        }
        if ("weak_reasoning".equals(followupReason)) {
            keywords.add("추론 근거");
        }
        return uniqueOrdered(keywords);
    }

    public String buildImprovementTip(List<String> weakPoints) {
        if (weakPoints.isEmpty()) {
            return "핵심 개념과 근거를 잘 설명했습니다. 같은 구조를 유지하세요.";
        }
        return "보완 우선순위: " + String.join(", ", weakPoints) + ". 다음 답변에서는 근거와 예시를 함께 제시하세요.";
    }

    public String buildWhyWeak(List<String> weakPoints, AnswerEvaluationResult result, String coachingMessage) {
        if (weakPoints.isEmpty()) {
            return "핵심 개념과 근거 제시가 안정적입니다. 현재 답변 구조를 유지하세요.";
        }

        String followupHint = switch (result.getFollowupReason()) {
            case "factual_error_or_uncertainty" -> "사실 관계가 불명확해 신뢰도가 떨어졌습니다.";
            case "missing_core_detail" -> "핵심 세부 정보가 부족해 답변 완성도가 낮았습니다.";
            case "weak_reasoning" -> "근거와 결론의 연결이 약해 설득력이 떨어졌습니다.";
            default -> "";
        };

        StringBuilder builder = new StringBuilder();
        builder.append("이번 답변은 ").append(String.join(", ", weakPoints)).append(" 축 보완이 필요합니다.");
        if (!followupHint.isBlank()) {
            builder.append(" ").append(followupHint);
        }

        if (coachingMessage != null && !coachingMessage.isBlank()) {
            builder.append(" 코칭 포인트: ").append(coachingMessage.trim());
        }
        return builder.toString();
    }

    public String buildHowToAnswer(List<String> weakPoints, String coachingMessage) {
        List<String> structureTips = new ArrayList<>();
        structureTips.add("답변은 결론 1문장 -> 근거 2문장 -> 실무 예시 1문장 순서로 말하세요.");

        if (weakPoints.contains("정확성")) {
            structureTips.add("첫 문장에서 핵심 용어를 정확히 정의하고 기준을 명확히 제시하세요.");
        }
        if (weakPoints.contains("논리성")) {
            structureTips.add("근거마다 '왜냐하면'과 '따라서'를 사용해 인과 관계를 드러내세요.");
        }
        if (weakPoints.contains("깊이")) {
            structureTips.add("대안 1개와 트레이드오프 1개를 반드시 포함하세요.");
        }
        if (weakPoints.contains("전달력")) {
            structureTips.add("마지막 문장에서 핵심 결론을 1줄로 다시 요약하세요.");
        }

        if (coachingMessage != null && !coachingMessage.isBlank()) {
            structureTips.add("직전 코칭 반영: " + coachingMessage.trim());
        }

        return String.join(" ", structureTips);
    }

    public String buildExampleAnswer(String modelAnswer, String questionContent) {
        String normalized = modelAnswer == null ? "" : modelAnswer.replaceAll("\\s+", " ").trim();
        if (!normalized.isBlank()) {
            List<String> sentences = Arrays.stream(normalized.split("(?<=[.!?])\\s+"))
                    .map(String::trim)
                    .filter(sentence -> !sentence.isBlank())
                    .toList();

            if (sentences.size() >= 3) {
                return String.join(" ", sentences.subList(0, Math.min(5, sentences.size())));
            }

            if (normalized.length() <= 320) {
                return normalized;
            }
            return normalized.substring(0, 320) + "...";
        }

        return "예시 답변: 먼저 '" + questionContent + "'의 핵심 개념을 한 문장으로 정의하고, "
                + "선택한 접근의 이유를 근거로 설명한 뒤, 실제 적용 사례와 한계를 함께 정리하세요.";
    }

    public List<String> uniqueOrdered(List<String> input) {
        Map<String, Boolean> seen = new LinkedHashMap<>();
        for (String item : input) {
            String normalized = item == null ? "" : item.trim().toLowerCase(Locale.ROOT);
            if (normalized.isBlank()) {
                continue;
            }
            seen.putIfAbsent(item, true);
        }
        return new ArrayList<>(seen.keySet());
    }
}
