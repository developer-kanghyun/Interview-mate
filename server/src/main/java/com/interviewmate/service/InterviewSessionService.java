package com.interviewmate.service;

import com.interviewmate.application.ai.usecase.GenerateSessionQuestionPlanUseCase;
import com.interviewmate.dto.request.InterviewSessionStartRequest;
import com.interviewmate.dto.response.InterviewSessionStartResponse;
import com.interviewmate.domain.interview.policy.InterviewerCharacter;
import com.interviewmate.domain.interview.policy.InterviewSessionStatus;
import com.interviewmate.entity.InterviewQuestion;
import com.interviewmate.entity.InterviewSession;
import com.interviewmate.entity.InterviewSessionQuestion;
import com.interviewmate.entity.User;
import com.interviewmate.global.error.AppException;
import com.interviewmate.global.error.ErrorCode;
import com.interviewmate.repository.InterviewQuestionRepository;
import com.interviewmate.repository.InterviewSessionRepository;
import com.interviewmate.repository.InterviewSessionQuestionRepository;
import com.interviewmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class InterviewSessionService {

    private static final int DEFAULT_TOTAL_QUESTIONS = 7;
    private static final int GUEST_PREVIEW_TOTAL_QUESTIONS = 1;

    private final UserRepository userRepository;
    private final InterviewQuestionRepository interviewQuestionRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final InterviewSessionQuestionRepository interviewSessionQuestionRepository;
    private final GenerateSessionQuestionPlanUseCase generateSessionQuestionPlanUseCase;

    @Transactional
    public InterviewSessionStartResponse startSession(InterviewSessionStartRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "사용자를 찾을 수 없습니다."));

        int totalQuestions = user.isGuestUser()
                ? GUEST_PREVIEW_TOTAL_QUESTIONS
                : DEFAULT_TOTAL_QUESTIONS;

        List<GenerateSessionQuestionPlanUseCase.GeneratedQuestion> questionPlan = generateSessionQuestionPlanUseCase.execute(
                request.getJobRole(),
                request.getStack(),
                request.getDifficulty(),
                totalQuestions
        );

        if (questionPlan.isEmpty()) {
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "면접 질문 생성에 실패했습니다.");
        }

        List<InterviewQuestion> generatedQuestions = new ArrayList<>();
        for (GenerateSessionQuestionPlanUseCase.GeneratedQuestion generatedQuestion : questionPlan) {
            InterviewQuestion question = new InterviewQuestion();
            question.setJobRole(request.getJobRole());
            question.setQuestionCategory(generatedQuestion.category());
            question.setDifficulty(generatedQuestion.difficulty());
            question.setContent(generatedQuestion.content());
            question.setActive(false);
            generatedQuestions.add(interviewQuestionRepository.save(question));
        }

        InterviewSession interviewSession = new InterviewSession(
                user,
                request.getJobRole(),
                request.getStack(),
                request.getDifficulty(),
                resolveInterviewerCharacter(request.getInterviewerCharacter()),
                Math.min(totalQuestions, generatedQuestions.size()),
                InterviewSessionStatus.IN_PROGRESS
        );

        InterviewSession savedSession = interviewSessionRepository.save(interviewSession);

        for (int index = 0; index < savedSession.getTotalQuestions(); index++) {
            InterviewQuestion question = generatedQuestions.get(index);
            InterviewSessionQuestion mapping = new InterviewSessionQuestion(savedSession, question, index + 1);
            interviewSessionQuestionRepository.save(mapping);
        }

        InterviewQuestion firstQuestion = generatedQuestions.get(0);

        return InterviewSessionStartResponse.builder()
                .sessionId(String.valueOf(savedSession.getId()))
                .jobRole(savedSession.getJobRole())
                .interviewerCharacter(savedSession.getInterviewerCharacter())
                .totalQuestions(savedSession.getTotalQuestions())
                .status(savedSession.getStatus())
                .startedAt(savedSession.getStartedAt())
                .firstQuestion(InterviewSessionStartResponse.FirstQuestionDto.builder()
                        .questionId(String.valueOf(firstQuestion.getId()))
                        .category(firstQuestion.getQuestionCategory())
                        .difficulty(firstQuestion.getDifficulty())
                        .content(firstQuestion.getContent())
                        .build())
                .build();
    }

    private String resolveInterviewerCharacter(String requestedCharacter) {
        if (requestedCharacter == null || requestedCharacter.isBlank()) {
            return InterviewerCharacter.JET;
        }
        return requestedCharacter;
    }
}
