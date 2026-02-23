package com.interviewmate.service;

import com.interviewmate.dto.response.InterviewSessionEndResponse;
import com.interviewmate.domain.interview.policy.InterviewSessionEndReason;
import com.interviewmate.domain.interview.policy.InterviewSessionStatus;
import com.interviewmate.entity.InterviewSession;
import com.interviewmate.global.error.AppException;
import com.interviewmate.global.error.ErrorCode;
import com.interviewmate.repository.InterviewSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InterviewSessionEndService {

    private final InterviewSessionRepository interviewSessionRepository;

    @Transactional
    public InterviewSessionEndResponse endSession(Long sessionId, Long userId, String reason) {
        InterviewSession session = interviewSessionRepository.findByIdAndUser_Id(sessionId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT, "세션을 찾을 수 없습니다."));

        if (InterviewSessionStatus.COMPLETED.equals(session.getStatus())) {
            throw new AppException(ErrorCode.INVALID_INPUT, "이미 종료된 세션입니다.");
        }

        session.setStatus(InterviewSessionStatus.COMPLETED);
        String normalizedReason = normalizeReason(reason);
        session.setEndReason(normalizedReason);
        InterviewSession savedSession = interviewSessionRepository.saveAndFlush(session);

        return InterviewSessionEndResponse.builder()
                .sessionId(String.valueOf(savedSession.getId()))
                .sessionStatus(savedSession.getStatus())
                .endReason(savedSession.getEndReason())
                .endedAt(savedSession.getUpdatedAt())
                .build();
    }

    private String normalizeReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return InterviewSessionEndReason.USER_END;
        }
        if (InterviewSessionEndReason.COMPLETED_ALL_QUESTIONS.equals(reason)) {
            return InterviewSessionEndReason.COMPLETED_ALL_QUESTIONS;
        }
        return InterviewSessionEndReason.USER_END;
    }
}
