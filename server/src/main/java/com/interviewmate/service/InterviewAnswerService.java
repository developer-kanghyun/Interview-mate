package com.interviewmate.service;

import com.interviewmate.application.interview.usecase.SubmitInterviewAnswerUseCase;
import com.interviewmate.dto.request.InterviewAnswerSubmitRequest;
import com.interviewmate.dto.response.InterviewAnswerSubmitResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InterviewAnswerService {

    private final SubmitInterviewAnswerUseCase submitInterviewAnswerUseCase;

    @Transactional
    public InterviewAnswerSubmitResponse submitAnswer(Long sessionId, InterviewAnswerSubmitRequest request) {
        return submitInterviewAnswerUseCase.submitAnswer(sessionId, request);
    }
}
