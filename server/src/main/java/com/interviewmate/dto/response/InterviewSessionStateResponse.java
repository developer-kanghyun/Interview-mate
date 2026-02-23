package com.interviewmate.dto.response;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class InterviewSessionStateResponse {
    private String sessionId;
    private String status;
    private String endReason;
    private String jobRole;
    private String interviewerCharacter;
    private int totalQuestions;
    private int answeredQuestions;
    private int remainingQuestions;
    private double completionRate;
    private LocalDateTime updatedAt;
    private CurrentQuestionDto currentQuestion;

    @Getter
    @Builder
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class CurrentQuestionDto {
        private String questionId;
        private int questionOrder;
        private String category;
        private String difficulty;
        private String content;
        private int followupCount;
    }
}
