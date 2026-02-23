package com.interviewmate.dto.response;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class InterviewSessionStudyResponse {
    private String sessionId;
    private String jobRole;
    private String performanceLevel;
    private List<String> weakKeywords;
    private List<String> recommendedActions;
    private List<QuestionStudyGuide> questionGuides;

    @Getter
    @Builder
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public static class QuestionStudyGuide {
        private int questionOrder;
        private String questionContent;
        private String interviewerEmotion;
        private List<String> weakConceptKeywords;
        private String modelAnswerPreview;
        private String actionTip;
    }
}
