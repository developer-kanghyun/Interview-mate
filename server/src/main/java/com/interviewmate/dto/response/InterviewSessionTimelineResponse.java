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
public class InterviewSessionTimelineResponse {
    private String sessionId;
    private String jobRole;
    private String interviewerCharacter;
    private String sessionStatus;
    private String endReason;
    private TimelineSummary summary;
    private List<TimelineItem> items;

    @Getter
    @Builder
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class TimelineSummary {
        private int pressureCount;
        private int encourageCount;
        private int neutralCount;
        private int scoredCount;
        private Double averageScore;
    }

    @Getter
    @Builder
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class TimelineItem {
        private String answerId;
        private String questionId;
        private int questionOrder;
        private String questionContent;
        private String answerText;
        private String interviewerEmotion;
        private Double scoreTotal;
        private String followupReason;
        private LocalDateTime answeredAt;
    }
}
