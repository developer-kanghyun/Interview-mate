package com.interviewmate.service;

import com.interviewmate.application.ai.usecase.EvaluateAnswerUseCase;
import com.interviewmate.domain.ai.AnswerEvaluationResult;
import com.interviewmate.dto.response.InterviewHistoryResponse;
import com.interviewmate.entity.InterviewAnswer;
import com.interviewmate.repository.InterviewAnswerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InterviewHistoryService {

    private static final int DEFAULT_LOOKBACK_DAYS = 30;
    private static final int MAX_LOOKBACK_DAYS = 90;

    private final InterviewAnswerRepository interviewAnswerRepository;
    private final EvaluateAnswerUseCase evaluateAnswerUseCase;

    @Transactional(readOnly = true)
    public InterviewHistoryResponse getHistory(Long userId, Integer requestedDays) {
        int lookbackDays = normalizeLookbackDays(requestedDays);
        LocalDateTime fromDateTime = LocalDateTime.now().minusDays(lookbackDays);
        List<InterviewAnswer> answers = interviewAnswerRepository
                .findBySessionQuestion_Session_User_IdAndCreatedAtAfterOrderByCreatedAtDesc(userId, fromDateTime);

        List<InterviewHistoryResponse.HistoryItem> items = new ArrayList<>();
        for (InterviewAnswer answer : answers) {
            AnswerEvaluationResult evaluation = resolveEvaluation(answer);
            items.add(InterviewHistoryResponse.HistoryItem.builder()
                    .sessionId(String.valueOf(answer.getSessionQuestion().getSession().getId()))
                    .sessionEndReason(answer.getSessionQuestion().getSession().getEndReason())
                    .questionId(String.valueOf(answer.getSessionQuestion().getQuestion().getId()))
                    .questionOrder(answer.getSessionQuestion().getQuestionOrder())
                    .questionContent(answer.getSessionQuestion().getQuestion().getContent())
                    .answerText(answer.getAnswerText())
                    .inputType(answer.getInputType())
                    .interviewerEmotion(answer.getInterviewerEmotion())
                    .totalScore(evaluation.getTotalScore())
                    .followupReason(evaluation.getFollowupReason())
                    .answeredAt(answer.getCreatedAt())
                    .build());
        }

        return InterviewHistoryResponse.builder()
                .requestedDays(lookbackDays)
                .totalCount(items.size())
                .items(items)
                .build();
    }

    private int normalizeLookbackDays(Integer requestedDays) {
        if (requestedDays == null || requestedDays <= 0) {
            return DEFAULT_LOOKBACK_DAYS;
        }
        return Math.min(requestedDays, MAX_LOOKBACK_DAYS);
    }

    private AnswerEvaluationResult resolveEvaluation(InterviewAnswer answer) {
        if (answer.getScoreTotal() != null
                && answer.getScoreAccuracy() != null
                && answer.getScoreLogic() != null
                && answer.getScoreDepth() != null
                && answer.getScoreDelivery() != null) {
            return AnswerEvaluationResult.builder()
                    .accuracy(answer.getScoreAccuracy())
                    .logic(answer.getScoreLogic())
                    .depth(answer.getScoreDepth())
                    .delivery(answer.getScoreDelivery())
                    .totalScore(answer.getScoreTotal())
                    .followupRequired(Boolean.TRUE.equals(answer.getFollowupRequired()))
                    .followupReason(answer.getFollowupReason() == null ? "none" : answer.getFollowupReason())
                    .build();
        }

        return evaluateAnswerUseCase.execute(
                answer.getSessionQuestion().getQuestion().getContent(),
                answer.getAnswerText(),
                answer.getSessionQuestion().getSession().getDifficulty(),
                answer.getSessionQuestion().getSession().getStack()
        );
    }
}
