package com.interviewmate.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class InterviewAnswerSubmitRequest {
    private static final int MAX_ANSWER_TEXT_LENGTH = 2000;

    @NotNull(message = "question_id는 필수입니다.")
    @JsonProperty("question_id")
    private Long questionId;

    @NotBlank(message = "answer_text는 필수입니다.")
    @Size(max = MAX_ANSWER_TEXT_LENGTH, message = "answer_text는 2000자를 초과할 수 없습니다.")
    @JsonProperty("answer_text")
    private String answerText;

    @NotBlank(message = "input_type은 필수입니다.")
    @Pattern(regexp = "text|voice", message = "input_type은 text 또는 voice여야 합니다.")
    @JsonProperty("input_type")
    private String inputType;
}
