package com.interviewmate.service;

import com.interviewmate.dto.response.InterviewSessionStateResponse;
import com.interviewmate.dto.response.LatestActiveSessionResponse;
import com.interviewmate.domain.interview.policy.InterviewSessionStatus;
import com.interviewmate.entity.InterviewSession;
import com.interviewmate.entity.InterviewSessionQuestion;
import com.interviewmate.global.error.AppException;
import com.interviewmate.global.error.ErrorCode;
import com.interviewmate.repository.InterviewAnswerRepository;
import com.interviewmate.repository.InterviewSessionQuestionRepository;
import com.interviewmate.repository.InterviewSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InterviewSessionStateService {
    private final InterviewSessionRepository interviewSessionRepository;
    private final InterviewSessionQuestionRepository interviewSessionQuestionRepository;
    private final InterviewAnswerRepository interviewAnswerRepository;

    @Transactional(readOnly = true)
    public InterviewSessionStateResponse getSessionState(Long sessionId, Long userId) {
        InterviewSession session = interviewSessionRepository.findByIdAndUser_Id(sessionId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT, "세션을 찾을 수 없습니다."));

        List<InterviewSessionQuestion> sessionQuestions = interviewSessionQuestionRepository
                .findBySession_IdOrderByQuestionOrderAsc(sessionId);
        if (sessionQuestions.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_INPUT, "세션 질문이 없습니다.");
        }

        int answeredQuestions = 0;
        InterviewSessionQuestion activeQuestion = null;
        for (InterviewSessionQuestion sessionQuestion : sessionQuestions) {
            long answerCount = interviewAnswerRepository.countBySessionQuestion_Id(sessionQuestion.getId());
            boolean questionCompleted = answerCount > sessionQuestion.getFollowupCount();
            if (questionCompleted) {
                answeredQuestions += 1;
            }

            if (activeQuestion == null && (answerCount == 0 || answerCount <= sessionQuestion.getFollowupCount())) {
                activeQuestion = sessionQuestion;
            }
        }

        InterviewSessionStateResponse.CurrentQuestionDto currentQuestion = activeQuestion == null
                ? null
                : InterviewSessionStateResponse.CurrentQuestionDto.builder()
                        .questionId(String.valueOf(activeQuestion.getQuestion().getId()))
                        .questionOrder(activeQuestion.getQuestionOrder())
                        .category(activeQuestion.getQuestion().getQuestionCategory())
                        .difficulty(activeQuestion.getQuestion().getDifficulty())
                        .content(activeQuestion.getQuestion().getContent())
                        .followupCount(activeQuestion.getFollowupCount())
                        .build();

        int remainingQuestions = Math.max(session.getTotalQuestions() - answeredQuestions, 0);
        double completionRate = session.getTotalQuestions() == 0
                ? 0.0
                : roundOneDecimal((answeredQuestions * 100.0) / session.getTotalQuestions());

        return InterviewSessionStateResponse.builder()
                .sessionId(String.valueOf(session.getId()))
                .status(session.getStatus())
                .endReason(session.getEndReason())
                .jobRole(session.getJobRole())
                .interviewerCharacter(session.getInterviewerCharacter())
                .totalQuestions(session.getTotalQuestions())
                .answeredQuestions(answeredQuestions)
                .remainingQuestions(remainingQuestions)
                .completionRate(completionRate)
                .updatedAt(session.getUpdatedAt())
                .currentQuestion(currentQuestion)
                .build();
    }

    @Transactional(readOnly = true)
    public LatestActiveSessionResponse getLatestActiveSession(Long userId) {
        InterviewSession latestActiveSession = interviewSessionRepository
                .findFirstByUser_IdAndStatusOrderByUpdatedAtDesc(userId, InterviewSessionStatus.IN_PROGRESS)
                .orElse(null);

        if (latestActiveSession == null) {
            return LatestActiveSessionResponse.builder()
                    .hasActiveSession(false)
                    .session(null)
                    .build();
        }

        InterviewSessionStateResponse stateResponse = getSessionState(latestActiveSession.getId(), userId);
        return LatestActiveSessionResponse.builder()
                .hasActiveSession(true)
                .session(stateResponse)
                .build();
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
