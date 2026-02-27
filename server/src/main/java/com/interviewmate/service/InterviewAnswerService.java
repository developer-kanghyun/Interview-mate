package com.interviewmate.service;

import com.interviewmate.application.ai.usecase.AdaptNextQuestionUseCase;
import com.interviewmate.application.ai.usecase.EvaluateAnswerUseCase;
import com.interviewmate.application.ai.usecase.GenerateFollowupQuestionUseCase;
import com.interviewmate.application.ai.usecase.GenerateRealtimeCoachingUseCase;
import com.interviewmate.dto.request.InterviewAnswerSubmitRequest;
import com.interviewmate.dto.response.InterviewAnswerSubmitResponse;
import com.interviewmate.domain.interview.policy.InterviewerEmotion;
import com.interviewmate.domain.interview.policy.InterviewSessionEndReason;
import com.interviewmate.domain.interview.policy.InterviewSessionStatus;
import com.interviewmate.entity.InterviewAnswer;
import com.interviewmate.entity.InterviewSession;
import com.interviewmate.entity.InterviewSessionQuestion;
import com.interviewmate.domain.ai.AnswerEvaluationResult;
import com.interviewmate.global.error.AppException;
import com.interviewmate.global.error.ErrorCode;
import com.interviewmate.repository.InterviewAnswerRepository;
import com.interviewmate.repository.InterviewQuestionRepository;
import com.interviewmate.repository.InterviewSessionQuestionRepository;
import com.interviewmate.repository.InterviewSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InterviewAnswerService {

    private static final int MAX_FOLLOWUP_PER_QUESTION_JUNIOR = 2;
    private static final int MAX_FOLLOWUP_PER_QUESTION_JOBSEEKER = 1;
    private static final int MAX_PRESSURE_PER_SESSION = 2;

    private final InterviewSessionQuestionRepository interviewSessionQuestionRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final InterviewAnswerRepository interviewAnswerRepository;
    private final InterviewQuestionRepository interviewQuestionRepository;
    private final EvaluateAnswerUseCase evaluateAnswerUseCase;
    private final GenerateFollowupQuestionUseCase generateFollowupQuestionUseCase;
    private final GenerateRealtimeCoachingUseCase generateRealtimeCoachingUseCase;
    private final AdaptNextQuestionUseCase adaptNextQuestionUseCase;

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
                request.getAnswerText(),
                sessionQuestion.getSession().getDifficulty(),
                sessionQuestion.getSession().getStack()
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
        int maxFollowupPerQuestion = resolveMaxFollowupPerQuestion(sessionQuestion.getSession());
        if (followupRequired) {
            if (sessionQuestion.getFollowupCount() >= maxFollowupPerQuestion) {
                followupRequired = false;
                followupReason = "followup_limit_reached";
            } else {
                String recentAnswerSummary = summarizeRecentAnswers(sessionQuestion.getSession(), request.getAnswerText());
                followupQuestion = generateFollowupQuestionUseCase.execute(
                        sessionQuestion.getSession().getJobRole(),
                        sessionQuestion.getSession().getStack(),
                        sessionQuestion.getSession().getDifficulty(),
                        sessionQuestion.getQuestion().getContent(),
                        request.getAnswerText(),
                        recentAnswerSummary,
                        sessionQuestion.getSession().getInterviewerCharacter()
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
                if (!nextSessionQuestion.getQuestion().isActive()) {
                    String adaptedNextQuestion = adaptNextQuestionUseCase.execute(
                            sessionQuestion.getSession().getJobRole(),
                            sessionQuestion.getSession().getStack(),
                            sessionQuestion.getSession().getDifficulty(),
                            nextSessionQuestion.getQuestion().getContent(),
                            summarizeRecentAnswers(sessionQuestion.getSession(), request.getAnswerText()),
                            sessionQuestion.getSession().getInterviewerCharacter()
                    );
                    if (adaptedNextQuestion != null && !adaptedNextQuestion.isBlank()) {
                        nextSessionQuestion.getQuestion().setContent(adaptedNextQuestion);
                        interviewQuestionRepository.save(nextSessionQuestion.getQuestion());
                    }
                }
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
        GenerateRealtimeCoachingUseCase.RealtimeCoachingResult coachingMessage = generateRealtimeCoachingUseCase.execute(
                sessionQuestion.getSession().getJobRole(),
                sessionQuestion.getSession().getStack(),
                sessionQuestion.getSession().getDifficulty(),
                sessionQuestion.getQuestion().getContent(),
                request.getAnswerText(),
                evaluationResult,
                followupReason,
                sessionQuestion.getSession().getInterviewerCharacter()
        );
        savedAnswer.setCoachingMessage(coachingMessage.coachingMessage());
        interviewAnswerRepository.save(savedAnswer);
        int followupRemaining = Math.max(0, maxFollowupPerQuestion - sessionQuestion.getFollowupCount());

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
                .feedbackSummary(coachingMessage.feedbackSummary())
                .coachingMessage(coachingMessage.coachingMessage())
                .coachingAvailable(coachingMessage.coachingAvailable())
                .followupQuestion(followupQuestion)
                .interviewerEmotion(interviewerEmotion)
                .nextQuestion(nextQuestion)
                .sessionStatus(sessionStatus)
                .endReason(sessionQuestion.getSession().getEndReason())
                .sessionCompleted(sessionCompleted)
                .build();
    }

    private String summarizeRecentAnswers(InterviewSession session, String currentAnswer) {
        List<InterviewAnswer> answers = interviewAnswerRepository.findBySessionQuestion_Session_IdOrderByCreatedAtAsc(session.getId());
        int fromIndex = Math.max(answers.size() - 2, 0);
        StringBuilder summary = new StringBuilder();
        for (int index = fromIndex; index < answers.size(); index++) {
            String answerText = abbreviate(answers.get(index).getAnswerText());
            summary.append("답변").append(index - fromIndex + 1).append(": ").append(answerText).append(" | ");
        }
        if (summary.length() == 0 && currentAnswer != null) {
            summary.append("현재 답변: ").append(abbreviate(currentAnswer));
        }
        return summary.toString().trim();
    }

    private String abbreviate(String value) {
        if (value == null) {
            return "";
        }
        String normalized = value.replaceAll("\\s+", " ").trim();
        if (normalized.length() <= 180) {
            return normalized;
        }
        return normalized.substring(0, 180) + "...";
    }

    private String resolveInterviewerEmotion(InterviewSessionQuestion sessionQuestion, AnswerEvaluationResult evaluationResult) {
        double pressureThreshold = isJobseekerDifficulty(sessionQuestion.getSession().getDifficulty()) ? 2.6 : 2.9;
        boolean shouldPressure = evaluationResult.isFollowupRequired() || evaluationResult.getTotalScore() < pressureThreshold;
        if (shouldPressure && sessionQuestion.getSession().getInterviewerPressureCount() < MAX_PRESSURE_PER_SESSION) {
            sessionQuestion.getSession().setInterviewerPressureCount(sessionQuestion.getSession().getInterviewerPressureCount() + 1);
            return InterviewerEmotion.PRESSURE;
        }

        if (evaluationResult.getTotalScore() >= 4.0 && !evaluationResult.isFollowupRequired()) {
            return InterviewerEmotion.ENCOURAGE;
        }

        return InterviewerEmotion.NEUTRAL;
    }

    private int resolveMaxFollowupPerQuestion(InterviewSession session) {
        return isJobseekerDifficulty(session.getDifficulty())
                ? MAX_FOLLOWUP_PER_QUESTION_JOBSEEKER
                : MAX_FOLLOWUP_PER_QUESTION_JUNIOR;
    }

    private boolean isJobseekerDifficulty(String difficulty) {
        return !"junior".equalsIgnoreCase(difficulty);
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
