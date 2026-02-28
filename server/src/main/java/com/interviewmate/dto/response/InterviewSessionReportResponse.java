package com.interviewmate.dto.response;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class InterviewSessionReportResponse {
    private String sessionId;
    private String jobRole;
    private String sessionStatus;
    private String endReason;
    private int totalQuestions;
    private int answeredQuestions;
    private LocalDateTime generatedAt;
    private ScoreSummary scoreSummary;
    private String performanceLevel;
    private List<String> priorityFocuses;
    private List<String> weakKeywords;
    private List<QuestionReport> questions;

    @Getter
    @Builder
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class ScoreSummary {
        private double accuracy;
        private double logic;
        private double depth;
        private double delivery;
        private double totalScore;
    }

    @Getter
    @Builder
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class QuestionReport {
        private String questionId;
        private int questionOrder;
        private String questionContent;
        private String answerText;
        private String interviewerEmotion;
        private String coachingMessage;
        private String modelAnswer;
        private ScoreSummary score;
        private List<String> weakPoints;
        private List<String> weakConceptKeywords;
        private String improvementTip;
    }
}
