package com.interviewmate.service;

import com.interviewmate.application.ai.usecase.EvaluateAnswerUseCase;
import com.interviewmate.application.ai.usecase.GenerateFollowupQuestionUseCase;
import com.interviewmate.dto.request.InterviewAnswerSubmitRequest;
import com.interviewmate.dto.response.InterviewAnswerSubmitResponse;
import com.interviewmate.domain.interview.policy.InterviewerEmotion;
import com.interviewmate.domain.interview.policy.InterviewSessionEndReason;
import com.interviewmate.domain.interview.policy.InterviewSessionStatus;
import com.interviewmate.entity.InterviewAnswer;
import com.interviewmate.entity.InterviewSessionQuestion;
import com.interviewmate.domain.ai.AnswerEvaluationResult;
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
public class InterviewAnswerService {

    private static final int MAX_FOLLOWUP_PER_QUESTION = 2;
    private static final int MAX_PRESSURE_PER_SESSION = 2;

    private final InterviewSessionQuestionRepository interviewSessionQuestionRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final InterviewAnswerRepository interviewAnswerRepository;
    private final EvaluateAnswerUseCase evaluateAnswerUseCase;
    private final GenerateFollowupQuestionUseCase generateFollowupQuestionUseCase;

    @Transactional
    public InterviewAnswerSubmitResponse submitAnswer(Long sessionId, InterviewAnswerSubmitRequest request) {
        boolean isCompletedSession = interviewSessionRepository.findById(sessionId)
                .map(session -> InterviewSessionStatus.COMPLETED.equals(session.getStatus()))
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT, "세션을 찾을 수 없습니다."));
        if (isCompletedSession) {
            throw new AppException(ErrorCode.INVALID_INPUT, "이미 종료된 세션입니다.");
        }

        InterviewSessionQuestion sessionQuestion = resolveActiveSessionQuestion(sessionId);
        if (!sessionQuestion.getQuestion().getId().equals(request.getQuestionId())) {
            throw new AppException(ErrorCode.INVALID_INPUT, "현재 답변 가능한 질문이 아닙니다.");
        }

        AnswerEvaluationResult evaluationResult = evaluateAnswerUseCase.execute(
                sessionQuestion.getQuestion().getContent(),
                request.getAnswerText()
        );
        String interviewerEmotion = resolveInterviewerEmotion(sessionQuestion, evaluationResult);

        InterviewAnswer answer = new InterviewAnswer(
                sessionQuestion,
                request.getAnswerText(),
                request.getInputType(),
                interviewerEmotion
        );
        answer.setScoreAccuracy(evaluationResult.getAccuracy());
        answer.setScoreLogic(evaluationResult.getLogic());
        answer.setScoreDepth(evaluationResult.getDepth());
        answer.setScoreDelivery(evaluationResult.getDelivery());
        answer.setScoreTotal(evaluationResult.getTotalScore());
        answer.setFollowupRequired(evaluationResult.isFollowupRequired());
        answer.setFollowupReason(evaluationResult.getFollowupReason());
        InterviewAnswer savedAnswer = interviewAnswerRepository.save(answer);

        boolean followupRequired = evaluationResult.isFollowupRequired();
        String followupReason = evaluationResult.getFollowupReason();
        String followupQuestion = null;
        InterviewAnswerSubmitResponse.NextQuestionDto nextQuestion = null;
        String sessionStatus = InterviewSessionStatus.IN_PROGRESS;
        boolean sessionCompleted = false;

        if (followupRequired) {
            if (sessionQuestion.getFollowupCount() >= MAX_FOLLOWUP_PER_QUESTION) {
                followupRequired = false;
                followupReason = "followup_limit_reached";
            } else {
                followupQuestion = generateFollowupQuestionUseCase.execute(
                        sessionQuestion.getSession().getJobRole(),
                        sessionQuestion.getQuestion().getContent(),
                        request.getAnswerText()
                );
                sessionQuestion.incrementFollowupCount();
                interviewSessionQuestionRepository.save(sessionQuestion);
            }
        }

        if (!followupRequired) {
            InterviewSessionQuestion nextSessionQuestion = interviewSessionQuestionRepository
                    .findFirstBySession_IdAndQuestionOrderGreaterThanOrderByQuestionOrderAsc(
                            sessionId,
                            sessionQuestion.getQuestionOrder()
                    )
                    .orElse(null);

            if (nextSessionQuestion == null) {
                sessionQuestion.getSession().setStatus(InterviewSessionStatus.COMPLETED);
                sessionQuestion.getSession().setEndReason(InterviewSessionEndReason.COMPLETED_ALL_QUESTIONS);
                sessionStatus = InterviewSessionStatus.COMPLETED;
                sessionCompleted = true;
            } else {
                sessionStatus = InterviewSessionStatus.IN_PROGRESS;
                nextQuestion = InterviewAnswerSubmitResponse.NextQuestionDto.builder()
                        .questionId(String.valueOf(nextSessionQuestion.getQuestion().getId()))
                        .questionOrder(nextSessionQuestion.getQuestionOrder())
                        .category(nextSessionQuestion.getQuestion().getQuestionCategory())
                        .difficulty(nextSessionQuestion.getQuestion().getDifficulty())
                        .content(nextSessionQuestion.getQuestion().getContent())
                        .build();
            }
        }
        String coachingMessage = buildCoachingMessage(evaluationResult, followupReason);
        savedAnswer.setCoachingMessage(coachingMessage);
        interviewAnswerRepository.save(savedAnswer);
        int followupRemaining = Math.max(0, MAX_FOLLOWUP_PER_QUESTION - sessionQuestion.getFollowupCount());

        return InterviewAnswerSubmitResponse.builder()
                .answerId(String.valueOf(savedAnswer.getId()))
                .sessionId(String.valueOf(sessionId))
                .questionId(String.valueOf(request.getQuestionId()))
                .inputType(savedAnswer.getInputType())
                .interviewerCharacter(sessionQuestion.getSession().getInterviewerCharacter())
                .submittedAt(savedAnswer.getCreatedAt())
                .evaluation(InterviewAnswerSubmitResponse.EvaluationDto.builder()
                        .accuracy(evaluationResult.getAccuracy())
                        .logic(evaluationResult.getLogic())
                        .depth(evaluationResult.getDepth())
                        .delivery(evaluationResult.getDelivery())
                        .totalScore(evaluationResult.getTotalScore())
                        .followupRequired(followupRequired)
                        .followupReason(followupReason)
                        .followupRemaining(followupRemaining)
                        .build())
                .coachingMessage(coachingMessage)
                .followupQuestion(followupQuestion)
                .interviewerEmotion(interviewerEmotion)
                .nextQuestion(nextQuestion)
                .sessionStatus(sessionStatus)
                .endReason(sessionQuestion.getSession().getEndReason())
                .sessionCompleted(sessionCompleted)
                .build();
    }

    private String buildCoachingMessage(AnswerEvaluationResult evaluationResult, String followupReason) {
        String weakestAxis = "정확성";
        double weakestScore = evaluationResult.getAccuracy();

        if (evaluationResult.getLogic() < weakestScore) {
            weakestAxis = "논리성";
            weakestScore = evaluationResult.getLogic();
        }
        if (evaluationResult.getDepth() < weakestScore) {
            weakestAxis = "깊이";
            weakestScore = evaluationResult.getDepth();
        }
        if (evaluationResult.getDelivery() < weakestScore) {
            weakestAxis = "전달력";
        }

        if (evaluationResult.isFollowupRequired()) {
            String focusPoint = "핵심 근거";
            if ("factual_error_or_uncertainty".equals(followupReason)) {
                focusPoint = "정확한 개념 정의";
            } else if ("missing_core_detail".equals(followupReason)) {
                focusPoint = "핵심 원리와 예시";
            } else if ("weak_reasoning".equals(followupReason)) {
                focusPoint = "근거 중심의 추론";
            }
            return "다음 답변에서는 " + focusPoint + "를 먼저 말하고, 결론-근거-예시 순서로 3문장 이상 구성해보세요.";
        }

        return "강점은 유지하고 " + weakestAxis + "을(를) 조금 더 보강해보세요. 다음 답변에서는 핵심 키워드와 실무 예시를 함께 제시하면 더 좋아집니다.";
    }

    private String resolveInterviewerEmotion(InterviewSessionQuestion sessionQuestion, AnswerEvaluationResult evaluationResult) {
        boolean shouldPressure = evaluationResult.isFollowupRequired() || evaluationResult.getTotalScore() < 3.0;
        if (shouldPressure && sessionQuestion.getSession().getInterviewerPressureCount() < MAX_PRESSURE_PER_SESSION) {
            sessionQuestion.getSession().setInterviewerPressureCount(sessionQuestion.getSession().getInterviewerPressureCount() + 1);
            return InterviewerEmotion.PRESSURE;
        }

        if (evaluationResult.getTotalScore() >= 4.0 && !evaluationResult.isFollowupRequired()) {
            return InterviewerEmotion.ENCOURAGE;
        }

        return InterviewerEmotion.NEUTRAL;
    }

    private InterviewSessionQuestion resolveActiveSessionQuestion(Long sessionId) {
        List<InterviewSessionQuestion> sessionQuestions = interviewSessionQuestionRepository
                .findBySession_IdOrderByQuestionOrderAsc(sessionId);
        if (sessionQuestions.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_INPUT, "세션에 할당된 질문이 없습니다.");
        }

        for (InterviewSessionQuestion sessionQuestion : sessionQuestions) {
            long answerCount = interviewAnswerRepository.countBySessionQuestion_Id(sessionQuestion.getId());
            if (answerCount == 0) {
                return sessionQuestion;
            }
            if (answerCount <= sessionQuestion.getFollowupCount()) {
                return sessionQuestion;
            }
        }

        throw new AppException(ErrorCode.INVALID_INPUT, "이미 종료된 세션입니다.");
    }
}
