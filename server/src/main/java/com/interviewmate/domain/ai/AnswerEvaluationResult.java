package com.interviewmate.domain.ai;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AnswerEvaluationResult {
    private double accuracy;
    private double logic;
    private double depth;
    private double delivery;
    private double totalScore;
    private boolean followupRequired;
    private String followupReason;
}
