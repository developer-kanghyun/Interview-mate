package com.interviewmate.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class InterviewSessionStartRequest {

    @NotBlank(message = "job_role은 필수입니다.")
    @Pattern(
            regexp = "backend|frontend|app|cloud|data|design|pm",
            message = "job_role은 backend, frontend, app, cloud, data, design, pm 중 하나여야 합니다."
    )
    @JsonProperty("job_role")
    private String jobRole;

    @NotBlank(message = "stack은 필수입니다.")
    @Size(max = 120, message = "stack은 120자 이하여야 합니다.")
    @JsonProperty("stack")
    private String stack;

    @NotBlank(message = "difficulty는 필수입니다.")
    @Pattern(regexp = "jobseeker|junior", message = "difficulty는 jobseeker 또는 junior여야 합니다.")
    @JsonProperty("difficulty")
    private String difficulty;

    @Pattern(regexp = "luna|jet|iron", message = "interviewer_character는 luna, jet, iron 중 하나여야 합니다.")
    @JsonProperty("interviewer_character")
    private String interviewerCharacter;

    @Pattern(regexp = "none|weak_first", message = "retry_mode는 none 또는 weak_first여야 합니다.")
    @JsonProperty("retry_mode")
    private String retryMode;

    @JsonProperty("source_session_id")
    private Long sourceSessionId;
}
