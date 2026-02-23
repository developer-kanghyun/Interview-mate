package com.interviewmate.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class InterviewSessionEndRequest {

    @Pattern(
            regexp = "^(user_end|completed_all_questions)?$",
            message = "reason은 user_end 또는 completed_all_questions만 허용됩니다."
    )
    private String reason;
}

