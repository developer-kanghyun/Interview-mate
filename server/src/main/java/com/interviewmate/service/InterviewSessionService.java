package com.interviewmate.service;

import com.interviewmate.application.interview.usecase.StartInterviewSessionUseCase;
import com.interviewmate.dto.request.InterviewSessionStartRequest;
import com.interviewmate.dto.response.InterviewSessionStartResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InterviewSessionService {

    private final StartInterviewSessionUseCase startInterviewSessionUseCase;

    @Transactional
    public InterviewSessionStartResponse startSession(InterviewSessionStartRequest request, Long userId) {
        return startInterviewSessionUseCase.startSession(request, userId);
    }
}
