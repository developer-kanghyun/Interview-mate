package com.interviewmate.controller;

import com.interviewmate.dto.common.ApiResponse;
import com.interviewmate.dto.response.InterviewHistoryResponse;
import com.interviewmate.global.auth.AuthenticatedUserId;
import com.interviewmate.global.error.AppException;
import com.interviewmate.global.error.ErrorCode;
import com.interviewmate.service.InterviewHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/interview/history")
@RequiredArgsConstructor
public class InterviewHistoryController {

    private final InterviewHistoryService interviewHistoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<InterviewHistoryResponse>> getHistory(
            @AuthenticatedUserId Long userId,
            @RequestParam(value = "days", required = false) Integer days) {
        if (days != null && (days < 1 || days > 90)) {
            throw new AppException(ErrorCode.INVALID_INPUT, "days는 1~90 범위여야 합니다.");
        }
        log.info("면접 히스토리 조회: userId={}, days={}", userId, days);
        InterviewHistoryResponse response = interviewHistoryService.getHistory(userId, days);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
