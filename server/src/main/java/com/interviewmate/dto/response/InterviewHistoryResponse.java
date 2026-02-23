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
public class InterviewHistoryResponse {
    private int requestedDays;
    private int totalCount;
    private List<HistoryItem> items;

    @Getter
    @Builder
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class HistoryItem {
        private String sessionId;
        private String sessionEndReason;
        private String questionId;
        private int questionOrder;
        private String questionContent;
        private String answerText;
        private String inputType;
        private String interviewerEmotion;
        private double totalScore;
        private String followupReason;
        private LocalDateTime answeredAt;
    }
}
