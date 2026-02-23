package com.interviewmate.controller;

import com.interviewmate.dto.common.ApiResponse;
import com.interviewmate.dto.request.InterviewSessionStartRequest;
import com.interviewmate.dto.request.InterviewSessionEndRequest;
import com.interviewmate.dto.response.InterviewSessionReportResponse;
import com.interviewmate.dto.response.InterviewSessionStartResponse;
import com.interviewmate.dto.response.InterviewSessionStateResponse;
import com.interviewmate.dto.response.InterviewSessionStudyResponse;
import com.interviewmate.dto.response.InterviewSessionTimelineResponse;
import com.interviewmate.dto.response.InterviewSessionEndResponse;
import com.interviewmate.dto.response.LatestActiveSessionResponse;
import com.interviewmate.global.auth.AuthenticatedUserId;
import com.interviewmate.service.InterviewSessionEndService;
import com.interviewmate.service.InterviewSessionReportService;
import com.interviewmate.service.InterviewSessionService;
import com.interviewmate.service.InterviewSessionStateService;
import com.interviewmate.service.InterviewSessionStudyService;
import com.interviewmate.service.InterviewSessionTimelineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/interview/sessions")
@RequiredArgsConstructor
public class InterviewSessionController {

    private final InterviewSessionService interviewSessionService;
    private final InterviewSessionReportService interviewSessionReportService;
    private final InterviewSessionStateService interviewSessionStateService;
    private final InterviewSessionStudyService interviewSessionStudyService;
    private final InterviewSessionTimelineService interviewSessionTimelineService;
    private final InterviewSessionEndService interviewSessionEndService;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<InterviewSessionStartResponse>> startInterviewSession(
            @Valid @RequestBody InterviewSessionStartRequest request,
            @AuthenticatedUserId Long userId) {
        log.info("면접 세션 시작 요청: userId={}, jobRole={}", userId, request.getJobRole());
        InterviewSessionStartResponse response = interviewSessionService.startSession(request, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{sessionId}/report")
    public ResponseEntity<ApiResponse<InterviewSessionReportResponse>> getSessionReport(
            @PathVariable("sessionId") Long sessionId,
            @AuthenticatedUserId Long userId) {
        log.info("면접 세션 리포트 조회: userId={}, sessionId={}", userId, sessionId);
        InterviewSessionReportResponse response = interviewSessionReportService.getSessionReport(sessionId, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<InterviewSessionStateResponse>> getSessionState(
            @PathVariable("sessionId") Long sessionId,
            @AuthenticatedUserId Long userId) {
        InterviewSessionStateResponse response = interviewSessionStateService.getSessionState(sessionId, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/latest-active")
    public ResponseEntity<ApiResponse<LatestActiveSessionResponse>> getLatestActiveSession(
            @AuthenticatedUserId Long userId) {
        LatestActiveSessionResponse response = interviewSessionStateService.getLatestActiveSession(userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{sessionId}/study")
    public ResponseEntity<ApiResponse<InterviewSessionStudyResponse>> getSessionStudyGuide(
            @PathVariable("sessionId") Long sessionId,
            @AuthenticatedUserId Long userId) {
        InterviewSessionStudyResponse response = interviewSessionStudyService.getStudyGuide(sessionId, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{sessionId}/timeline")
    public ResponseEntity<ApiResponse<InterviewSessionTimelineResponse>> getSessionTimeline(
            @PathVariable("sessionId") Long sessionId,
            @AuthenticatedUserId Long userId) {
        InterviewSessionTimelineResponse response = interviewSessionTimelineService.getTimeline(sessionId, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<ApiResponse<InterviewSessionEndResponse>> endSession(
            @PathVariable("sessionId") Long sessionId,
            @Valid @RequestBody(required = false) InterviewSessionEndRequest request,
            @AuthenticatedUserId Long userId) {
        String reason = request == null ? null : request.getReason();
        InterviewSessionEndResponse response = interviewSessionEndService.endSession(sessionId, userId, reason);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
