package com.interviewmate.service;

import com.interviewmate.application.ai.usecase.EvaluateAnswerUseCase;
import com.interviewmate.application.ai.usecase.GenerateModelAnswerUseCase;
import com.interviewmate.domain.ai.AnswerEvaluationResult;
import com.interviewmate.domain.interview.policy.InterviewSessionStatus;
import com.interviewmate.dto.response.InterviewSessionReportResponse;
import com.interviewmate.entity.InterviewAnswer;
import com.interviewmate.entity.InterviewSession;
import com.interviewmate.global.error.AppException;
import com.interviewmate.global.error.ErrorCode;
import com.interviewmate.repository.InterviewAnswerRepository;
import com.interviewmate.repository.InterviewSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InterviewSessionReportService {

    private final InterviewSessionRepository interviewSessionRepository;
    private final InterviewAnswerRepository interviewAnswerRepository;
    private final EvaluateAnswerUseCase evaluateAnswerUseCase;
    private final GenerateModelAnswerUseCase generateModelAnswerUseCase;

    @Transactional(readOnly = true)
    public InterviewSessionReportResponse getSessionReport(Long sessionId, Long userId) {
        InterviewSession session = interviewSessionRepository.findByIdAndUser_Id(sessionId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT, "요청한 세션을 찾을 수 없습니다."));

        if (session.getUser() != null && session.getUser().isGuestUser()) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "리포트는 로그인 후 새 면접에서 확인할 수 있습니다.");
        }

        if (!InterviewSessionStatus.COMPLETED.equalsIgnoreCase(session.getStatus())) {
            throw new AppException(ErrorCode.INVALID_INPUT, "세션이 아직 종료되지 않았습니다.");
        }

        List<InterviewAnswer> answers = interviewAnswerRepository.findBySessionQuestion_Session_IdOrderByCreatedAtAsc(sessionId);
        Map<Long, InterviewAnswer> latestAnswerBySessionQuestion = getLatestAnswerBySessionQuestion(answers);

        List<InterviewSessionReportResponse.QuestionReport> questionReports = new ArrayList<>();
        List<String> weakKeywords = new ArrayList<>();

        double accuracySum = 0.0;
        double logicSum = 0.0;
        double depthSum = 0.0;
        double deliverySum = 0.0;
        double totalScoreSum = 0.0;

        for (InterviewAnswer answer : latestAnswerBySessionQuestion.values()) {
            AnswerEvaluationResult result = resolveEvaluation(answer);

            List<String> weakPoints = extractWeakPoints(result);
            List<String> weakConceptKeywords = extractWeakConceptKeywords(weakPoints, result.getFollowupReason());
            weakKeywords.addAll(weakPoints);
            weakKeywords.addAll(weakConceptKeywords);

            String coachingMessage = resolveCoachingMessage(answer, weakPoints);
            String modelAnswer = generateModelAnswerUseCase.execute(
                    session.getJobRole(),
                    answer.getSessionQuestion().getQuestion().getContent()
            );
            String whyWeak = buildWhyWeak(weakPoints, result, coachingMessage);
            String howToAnswer = buildHowToAnswer(weakPoints, coachingMessage);
            String exampleAnswer = buildExampleAnswer(
                    modelAnswer,
                    answer.getSessionQuestion().getQuestion().getContent()
            );

            accuracySum += result.getAccuracy();
            logicSum += result.getLogic();
            depthSum += result.getDepth();
            deliverySum += result.getDelivery();
            totalScoreSum += result.getTotalScore();

            questionReports.add(InterviewSessionReportResponse.QuestionReport.builder()
                    .questionId(String.valueOf(answer.getSessionQuestion().getQuestion().getId()))
                    .questionOrder(answer.getSessionQuestion().getQuestionOrder())
                    .questionContent(answer.getSessionQuestion().getQuestion().getContent())
                    .answerText(answer.getAnswerText())
                    .interviewerEmotion(answer.getInterviewerEmotion())
                    .coachingMessage(coachingMessage)
                    .modelAnswer(modelAnswer)
                    .score(toScoreSummary(
                            result.getAccuracy(),
                            result.getLogic(),
                            result.getDepth(),
                            result.getDelivery(),
                            result.getTotalScore()
                    ))
                    .weakPoints(weakPoints)
                    .weakConceptKeywords(weakConceptKeywords)
                    .improvementTip(buildImprovementTip(weakPoints))
                    .whyWeak(whyWeak)
                    .howToAnswer(howToAnswer)
                    .exampleAnswer(exampleAnswer)
                    .build());
        }

        int answeredQuestions = questionReports.size();
        InterviewSessionReportResponse.ScoreSummary scoreSummary = answeredQuestions == 0
                ? toScoreSummary(0, 0, 0, 0, 0)
                : toScoreSummary(
                        roundOneDecimal(accuracySum / answeredQuestions),
                        roundOneDecimal(logicSum / answeredQuestions),
                        roundOneDecimal(depthSum / answeredQuestions),
                        roundOneDecimal(deliverySum / answeredQuestions),
                        roundOneDecimal(totalScoreSum / answeredQuestions)
                );

        return InterviewSessionReportResponse.builder()
                .sessionId(String.valueOf(session.getId()))
                .jobRole(session.getJobRole())
                .sessionStatus(session.getStatus())
                .endReason(session.getEndReason())
                .totalQuestions(session.getTotalQuestions())
                .answeredQuestions(answeredQuestions)
                .generatedAt(LocalDateTime.now())
                .scoreSummary(scoreSummary)
                .performanceLevel(calculatePerformanceLevel(scoreSummary.getTotalScore()))
                .priorityFocuses(extractPriorityFocuses(scoreSummary))
                .weakKeywords(uniqueOrdered(weakKeywords))
                .questions(questionReports)
                .build();
    }

    private String resolveCoachingMessage(InterviewAnswer answer, List<String> weakPoints) {
        String coachingMessage = answer.getCoachingMessage();
        if (coachingMessage != null && !coachingMessage.isBlank()) {
            return coachingMessage;
        }
        return buildImprovementTip(weakPoints);
    }

    private Map<Long, InterviewAnswer> getLatestAnswerBySessionQuestion(List<InterviewAnswer> answers) {
        Map<Long, InterviewAnswer> latestAnswerBySessionQuestion = new LinkedHashMap<>();
        for (InterviewAnswer answer : answers) {
            Long sessionQuestionId = answer.getSessionQuestion().getId();
            latestAnswerBySessionQuestion.put(sessionQuestionId, answer);
        }
        return latestAnswerBySessionQuestion;
    }

    private List<String> extractWeakPoints(AnswerEvaluationResult result) {
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

    private List<String> extractWeakConceptKeywords(List<String> weakPoints, String followupReason) {
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

    private String buildImprovementTip(List<String> weakPoints) {
        if (weakPoints.isEmpty()) {
            return "핵심 개념과 근거를 잘 설명했습니다. 같은 구조를 유지하세요.";
        }
        return "보완 우선순위: " + String.join(", ", weakPoints) + ". 다음 답변에서는 근거와 예시를 함께 제시하세요.";
    }

    private String buildWhyWeak(List<String> weakPoints, AnswerEvaluationResult result, String coachingMessage) {
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

    private String buildHowToAnswer(List<String> weakPoints, String coachingMessage) {
        List<String> structureTips = new ArrayList<>();
        structureTips.add("답변은 결론 1문장 → 근거 2문장 → 실무 예시 1문장 순서로 말하세요.");

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

    private String buildExampleAnswer(String modelAnswer, String questionContent) {
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

    private List<String> uniqueOrdered(List<String> input) {
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

    private InterviewSessionReportResponse.ScoreSummary toScoreSummary(double accuracy, double logic, double depth, double delivery, double totalScore) {
        return InterviewSessionReportResponse.ScoreSummary.builder()
                .accuracy(accuracy)
                .logic(logic)
                .depth(depth)
                .delivery(delivery)
                .totalScore(totalScore)
                .build();
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private String calculatePerformanceLevel(double totalScore) {
        if (totalScore >= 4.3) {
            return "excellent";
        }
        if (totalScore >= 3.6) {
            return "good";
        }
        if (totalScore >= 2.8) {
            return "needs_improvement";
        }
        return "critical";
    }

    private List<String> extractPriorityFocuses(InterviewSessionReportResponse.ScoreSummary scoreSummary) {
        List<ScoreAxis> axes = new ArrayList<>();
        axes.add(new ScoreAxis("정확성", scoreSummary.getAccuracy()));
        axes.add(new ScoreAxis("논리성", scoreSummary.getLogic()));
        axes.add(new ScoreAxis("깊이", scoreSummary.getDepth()));
        axes.add(new ScoreAxis("전달력", scoreSummary.getDelivery()));

        axes.sort(Comparator.comparingDouble(ScoreAxis::score));
        List<String> focuses = new ArrayList<>();
        for (int i = 0; i < Math.min(2, axes.size()); i++) {
            focuses.add(axes.get(i).axis());
        }
        return focuses;
    }

    private record ScoreAxis(String axis, double score) {
    }

    private AnswerEvaluationResult resolveEvaluation(InterviewAnswer answer) {
        if (answer.getScoreTotal() != null
                && answer.getScoreAccuracy() != null
                && answer.getScoreLogic() != null
                && answer.getScoreDepth() != null
                && answer.getScoreDelivery() != null) {
            return AnswerEvaluationResult.builder()
                    .accuracy(answer.getScoreAccuracy())
                    .logic(answer.getScoreLogic())
                    .depth(answer.getScoreDepth())
                    .delivery(answer.getScoreDelivery())
                    .totalScore(answer.getScoreTotal())
                    .followupRequired(Boolean.TRUE.equals(answer.getFollowupRequired()))
                    .followupReason(answer.getFollowupReason() == null ? "none" : answer.getFollowupReason())
                    .build();
        }

        return evaluateAnswerUseCase.execute(
                answer.getSessionQuestion().getQuestion().getContent(),
                answer.getAnswerText(),
                answer.getSessionQuestion().getSession().getDifficulty(),
                answer.getSessionQuestion().getSession().getStack()
        );
    }
}
