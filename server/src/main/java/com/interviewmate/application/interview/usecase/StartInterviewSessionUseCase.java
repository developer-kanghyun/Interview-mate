package com.interviewmate.application.interview.usecase;

import com.interviewmate.application.ai.usecase.GenerateSessionQuestionPlanUseCase;
import com.interviewmate.dto.request.InterviewSessionStartRequest;
import com.interviewmate.dto.response.InterviewSessionStartResponse;
import com.interviewmate.domain.interview.policy.InterviewerCharacter;
import com.interviewmate.domain.interview.policy.InterviewSessionStatus;
import com.interviewmate.entity.InterviewAnswer;
import com.interviewmate.entity.InterviewQuestion;
import com.interviewmate.entity.InterviewSession;
import com.interviewmate.entity.InterviewSessionQuestion;
import com.interviewmate.entity.User;
import com.interviewmate.global.error.AppException;
import com.interviewmate.global.error.ErrorCode;
import com.interviewmate.repository.InterviewAnswerRepository;
import com.interviewmate.repository.InterviewQuestionRepository;
import com.interviewmate.repository.InterviewSessionRepository;
import com.interviewmate.repository.InterviewSessionQuestionRepository;
import com.interviewmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StartInterviewSessionUseCase {

    private static final int DEFAULT_TOTAL_QUESTIONS = 7;
    private static final int GUEST_PREVIEW_TOTAL_QUESTIONS = 1;
    private static final double WEAK_SCORE_THRESHOLD = 3.2;
    private static final int QUESTION_GENERATION_RETRY_LIMIT = 3;

    private final UserRepository userRepository;
    private final InterviewAnswerRepository interviewAnswerRepository;
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

        List<SessionQuestionSeed> selectedQuestionSeeds = new ArrayList<>();
        Map<String, Boolean> usedQuestionContents = new LinkedHashMap<>();

        if (isWeakFirstRetry(request)) {
            selectedQuestionSeeds.addAll(resolveWeakFirstQuestionSeeds(request, user, totalQuestions, usedQuestionContents));
        }

        int remainingQuestionCount = Math.max(0, totalQuestions - selectedQuestionSeeds.size());
        if (remainingQuestionCount > 0) {
            selectedQuestionSeeds.addAll(generateFreshQuestionSeeds(request, remainingQuestionCount, usedQuestionContents));
        }

        if (selectedQuestionSeeds.isEmpty()) {
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "면접 질문 생성에 실패했습니다.");
        }

        List<InterviewQuestion> generatedQuestions = new ArrayList<>();
        for (SessionQuestionSeed questionSeed : selectedQuestionSeeds) {
            InterviewQuestion question = new InterviewQuestion();
            question.setJobRole(request.getJobRole());
            question.setQuestionCategory(questionSeed.category());
            question.setDifficulty(questionSeed.difficulty());
            question.setContent(questionSeed.content());
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

    private boolean isWeakFirstRetry(InterviewSessionStartRequest request) {
        return "weak_first".equalsIgnoreCase(resolveRetryMode(request.getRetryMode()));
    }

    private String resolveRetryMode(String retryMode) {
        if (retryMode == null || retryMode.isBlank()) {
            return "none";
        }
        return retryMode;
    }

    private List<SessionQuestionSeed> resolveWeakFirstQuestionSeeds(
            InterviewSessionStartRequest request,
            User user,
            int totalQuestions,
            Map<String, Boolean> usedQuestionContents
    ) {
        Long sourceSessionId = request.getSourceSessionId();
        if (sourceSessionId == null) {
            throw new AppException(ErrorCode.INVALID_INPUT, "retry_mode가 weak_first이면 source_session_id가 필요합니다.");
        }

        InterviewSession sourceSession = interviewSessionRepository.findByIdAndUser_Id(sourceSessionId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT, "유효한 source_session_id가 아닙니다."));

        if (!InterviewSessionStatus.COMPLETED.equalsIgnoreCase(sourceSession.getStatus())) {
            throw new AppException(ErrorCode.INVALID_INPUT, "완료된 세션만 재연습 소스로 사용할 수 있습니다.");
        }

        List<InterviewAnswer> sourceAnswers = interviewAnswerRepository
                .findBySessionQuestion_Session_IdOrderByCreatedAtAsc(sourceSessionId);
        Map<Long, InterviewAnswer> latestAnswerBySessionQuestion = new LinkedHashMap<>();
        for (InterviewAnswer answer : sourceAnswers) {
            latestAnswerBySessionQuestion.put(answer.getSessionQuestion().getId(), answer);
        }

        List<InterviewAnswer> weakAnswers = latestAnswerBySessionQuestion.values().stream()
                .filter(this::isWeakAnswer)
                .sorted(Comparator
                        .comparingDouble(this::weaknessSortScore)
                        .thenComparingInt(answer -> answer.getSessionQuestion().getQuestionOrder()))
                .toList();

        List<SessionQuestionSeed> weakFirstSeeds = new ArrayList<>();
        for (InterviewAnswer weakAnswer : weakAnswers) {
            if (weakFirstSeeds.size() >= totalQuestions) {
                break;
            }

            InterviewQuestion sourceQuestion = weakAnswer.getSessionQuestion().getQuestion();
            String normalizedContent = normalizeQuestionContent(sourceQuestion.getContent());
            if (normalizedContent.isBlank() || usedQuestionContents.containsKey(normalizedContent)) {
                continue;
            }

            usedQuestionContents.put(normalizedContent, true);
            weakFirstSeeds.add(new SessionQuestionSeed(
                    sourceQuestion.getQuestionCategory(),
                    sourceQuestion.getDifficulty(),
                    sourceQuestion.getContent()
            ));
        }
        return weakFirstSeeds;
    }

    private boolean isWeakAnswer(InterviewAnswer answer) {
        boolean weakByScore = answer.getScoreTotal() != null && answer.getScoreTotal() < WEAK_SCORE_THRESHOLD;
        boolean weakByFollowup = Boolean.TRUE.equals(answer.getFollowupRequired());
        return weakByScore || weakByFollowup;
    }

    private double weaknessSortScore(InterviewAnswer answer) {
        if (answer.getScoreTotal() == null) {
            return 5.0;
        }
        return answer.getScoreTotal();
    }

    private List<SessionQuestionSeed> generateFreshQuestionSeeds(
            InterviewSessionStartRequest request,
            int requiredCount,
            Map<String, Boolean> usedQuestionContents
    ) {
        List<SessionQuestionSeed> generatedSeeds = new ArrayList<>();
        int retries = 0;

        while (generatedSeeds.size() < requiredCount && retries < QUESTION_GENERATION_RETRY_LIMIT) {
            int remainingCount = requiredCount - generatedSeeds.size();
            List<GenerateSessionQuestionPlanUseCase.GeneratedQuestion> questionPlan = generateSessionQuestionPlanUseCase.execute(
                    request.getJobRole(),
                    request.getStack(),
                    request.getDifficulty(),
                    remainingCount
            );

            if (questionPlan.isEmpty()) {
                break;
            }

            int beforeSize = generatedSeeds.size();
            for (GenerateSessionQuestionPlanUseCase.GeneratedQuestion generatedQuestion : questionPlan) {
                String normalizedContent = normalizeQuestionContent(generatedQuestion.content());
                if (normalizedContent.isBlank() || usedQuestionContents.containsKey(normalizedContent)) {
                    continue;
                }

                usedQuestionContents.put(normalizedContent, true);
                generatedSeeds.add(new SessionQuestionSeed(
                        generatedQuestion.category(),
                        generatedQuestion.difficulty(),
                        generatedQuestion.content()
                ));
            }

            if (generatedSeeds.size() == beforeSize) {
                retries += 1;
            }
        }

        return generatedSeeds;
    }

    private String normalizeQuestionContent(String content) {
        if (content == null) {
            return "";
        }
        return content.toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", " ")
                .trim();
    }

    private record SessionQuestionSeed(String category, String difficulty, String content) {
    }
}
