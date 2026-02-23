package com.interviewmate.controller;

import com.interviewmate.dto.common.ApiResponse;
import com.interviewmate.dto.request.InterviewAnswerSubmitRequest;
import com.interviewmate.dto.response.InterviewAnswerSubmitResponse;
import com.interviewmate.service.InterviewAnswerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/interview/sessions")
@RequiredArgsConstructor
public class InterviewAnswerController {

    private final InterviewAnswerService interviewAnswerService;

    @PostMapping("/{sessionId}/answers")
    public ResponseEntity<ApiResponse<InterviewAnswerSubmitResponse>> submitAnswer(
            @PathVariable("sessionId") Long sessionId,
            @Valid @RequestBody InterviewAnswerSubmitRequest request) {
        log.info("면접 답변 제출: sessionId={}, questionId={}, inputType={}",
                sessionId, request.getQuestionId(), request.getInputType());
        InterviewAnswerSubmitResponse response = interviewAnswerService.submitAnswer(sessionId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
