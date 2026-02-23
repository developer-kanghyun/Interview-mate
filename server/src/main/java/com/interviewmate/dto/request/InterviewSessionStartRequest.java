package com.interviewmate.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class InterviewSessionStartRequest {

    @NotBlank(message = "job_role은 필수입니다.")
    @Pattern(regexp = "backend|frontend", message = "job_role은 backend 또는 frontend여야 합니다.")
    @JsonProperty("job_role")
    private String jobRole;

    @Pattern(regexp = "luna|jet|iron", message = "interviewer_character는 luna, jet, iron 중 하나여야 합니다.")
    @JsonProperty("interviewer_character")
    private String interviewerCharacter;
}
