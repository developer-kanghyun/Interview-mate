package com.interviewmate.dto.response;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class InterviewSessionStartResponse {
    private String sessionId;
    private String jobRole;
    private String interviewerCharacter;
    private int totalQuestions;
    private String status;
    private LocalDateTime startedAt;
    private FirstQuestionDto firstQuestion;

    @Getter
    @Builder
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class FirstQuestionDto {
        private String questionId;
        private String category;
        private String difficulty;
        private String content;
    }
}
