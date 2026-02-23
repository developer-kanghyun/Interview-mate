package com.interviewmate.service;

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
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class InterviewSessionService {

    private static final int DEFAULT_TOTAL_QUESTIONS = 7;
    private static final int GUEST_PREVIEW_TOTAL_QUESTIONS = 1;
    private static final int TARGET_JOB_QUESTIONS = 5;
    private static final int TARGET_CS_QUESTIONS = 2;
    private static final String CATEGORY_JOB = "job";
    private static final String CATEGORY_CS = "cs";

    private final UserRepository userRepository;
    private final InterviewQuestionRepository interviewQuestionRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final InterviewSessionQuestionRepository interviewSessionQuestionRepository;

    @Transactional
    public InterviewSessionStartResponse startSession(InterviewSessionStartRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "사용자를 찾을 수 없습니다."));

        List<InterviewQuestion> allActiveQuestions = interviewQuestionRepository
                .findByJobRoleAndIsActiveTrueOrderByIdAsc(request.getJobRole());
        List<InterviewQuestion> selectedQuestions = selectSessionQuestions(allActiveQuestions);

        if (selectedQuestions.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_INPUT, "해당 직무의 질문이 준비되지 않았습니다.");
        }

        int totalQuestions = user.isGuestUser()
                ? Math.min(GUEST_PREVIEW_TOTAL_QUESTIONS, selectedQuestions.size())
                : Math.min(DEFAULT_TOTAL_QUESTIONS, selectedQuestions.size());

        InterviewSession interviewSession = new InterviewSession(
                user,
                request.getJobRole(),
                resolveInterviewerCharacter(request.getInterviewerCharacter()),
                totalQuestions,
                InterviewSessionStatus.IN_PROGRESS
        );

        InterviewSession savedSession = interviewSessionRepository.save(interviewSession);

        for (int index = 0; index < savedSession.getTotalQuestions(); index++) {
            InterviewQuestion question = selectedQuestions.get(index);
            InterviewSessionQuestion mapping = new InterviewSessionQuestion(savedSession, question, index + 1);
            interviewSessionQuestionRepository.save(mapping);
        }

        InterviewQuestion firstQuestion = selectedQuestions.get(0);

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

    private List<InterviewQuestion> selectSessionQuestions(List<InterviewQuestion> allActiveQuestions) {
        java.util.ArrayList<InterviewQuestion> selected = new java.util.ArrayList<>();
        Set<Long> selectedQuestionIds = new HashSet<>();

        for (InterviewQuestion question : allActiveQuestions) {
            if (!isCategory(question.getQuestionCategory(), CATEGORY_JOB)) {
                continue;
            }
            if (selected.size() >= TARGET_JOB_QUESTIONS) {
                break;
            }
            selected.add(question);
            selectedQuestionIds.add(question.getId());
        }

        int selectedCsCount = 0;
        for (InterviewQuestion question : allActiveQuestions) {
            if (!isCategory(question.getQuestionCategory(), CATEGORY_CS)) {
                continue;
            }
            if (selectedCsCount >= TARGET_CS_QUESTIONS) {
                break;
            }
            if (selectedQuestionIds.contains(question.getId())) {
                continue;
            }
            selected.add(question);
            selectedQuestionIds.add(question.getId());
            selectedCsCount += 1;
        }

        for (InterviewQuestion question : allActiveQuestions) {
            if (selected.size() >= DEFAULT_TOTAL_QUESTIONS) {
                break;
            }
            if (selectedQuestionIds.contains(question.getId())) {
                continue;
            }
            selected.add(question);
            selectedQuestionIds.add(question.getId());
        }

        return selected;
    }

    private boolean isCategory(String category, String targetCategory) {
        if (category == null || targetCategory == null) {
            return false;
        }
        return category.trim().toLowerCase(Locale.ROOT).equals(targetCategory);
    }
}
