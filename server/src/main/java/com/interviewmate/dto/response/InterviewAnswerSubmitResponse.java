package com.interviewmate.dto.response;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class InterviewAnswerSubmitResponse {
    private String answerId;
    private String sessionId;
    private String questionId;
    private String inputType;
    private String interviewerCharacter;
    private LocalDateTime submittedAt;
    private EvaluationDto evaluation;
    private String feedbackSummary;
    private String coachingMessage;
    private boolean coachingAvailable;
    private String followupQuestion;
    private String interviewerEmotion;
    private NextQuestionDto nextQuestion;
    private String sessionStatus;
    private String endReason;
    private boolean sessionCompleted;

    @Getter
    @Builder
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class EvaluationDto {
        private double accuracy;
        private double logic;
        private double depth;
        private double delivery;
        private double totalScore;
        private boolean followupRequired;
        private String followupReason;
        private int followupRemaining;
    }

    @Getter
    @Builder
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class NextQuestionDto {
        private String questionId;
        private int questionOrder;
        private String category;
        private String difficulty;
        private String content;
    }
}
