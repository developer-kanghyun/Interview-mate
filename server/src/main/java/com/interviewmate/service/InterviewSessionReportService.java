package com.interviewmate.service;

import com.interviewmate.application.interview.usecase.BuildInterviewSessionReportUseCase;
import com.interviewmate.dto.response.InterviewSessionReportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InterviewSessionReportService {

    private final BuildInterviewSessionReportUseCase buildInterviewSessionReportUseCase;

    @Transactional(readOnly = true)
    public InterviewSessionReportResponse getSessionReport(Long sessionId, Long userId) {
        return buildInterviewSessionReportUseCase.getSessionReport(sessionId, userId);
    }
}
