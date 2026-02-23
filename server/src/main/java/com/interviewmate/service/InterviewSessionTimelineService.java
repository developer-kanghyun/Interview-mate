package com.interviewmate.service;

import com.interviewmate.dto.response.InterviewSessionTimelineResponse;
import com.interviewmate.domain.interview.policy.InterviewerEmotion;
import com.interviewmate.entity.InterviewAnswer;
import com.interviewmate.entity.InterviewSession;
import com.interviewmate.global.error.AppException;
import com.interviewmate.global.error.ErrorCode;
import com.interviewmate.repository.InterviewAnswerRepository;
import com.interviewmate.repository.InterviewSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InterviewSessionTimelineService {

    private final InterviewSessionRepository interviewSessionRepository;
    private final InterviewAnswerRepository interviewAnswerRepository;

    @Transactional(readOnly = true)
    public InterviewSessionTimelineResponse getTimeline(Long sessionId, Long userId) {
        InterviewSession session = interviewSessionRepository.findByIdAndUser_Id(sessionId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT, "요청한 세션을 찾을 수 없습니다."));

        List<InterviewAnswer> answers = interviewAnswerRepository.findBySessionQuestion_Session_IdOrderByCreatedAtAsc(sessionId);
        List<InterviewSessionTimelineResponse.TimelineItem> items = new ArrayList<>();
        int pressureCount = 0;
        int encourageCount = 0;
        int neutralCount = 0;
        int scoredCount = 0;
        double scoreSum = 0.0;
        for (InterviewAnswer answer : answers) {
            if (InterviewerEmotion.PRESSURE.equals(answer.getInterviewerEmotion())) {
                pressureCount += 1;
            } else if (InterviewerEmotion.ENCOURAGE.equals(answer.getInterviewerEmotion())) {
                encourageCount += 1;
            } else {
                neutralCount += 1;
            }
            if (answer.getScoreTotal() != null) {
                scoredCount += 1;
                scoreSum += answer.getScoreTotal();
            }
            items.add(InterviewSessionTimelineResponse.TimelineItem.builder()
                    .answerId(String.valueOf(answer.getId()))
                    .questionId(String.valueOf(answer.getSessionQuestion().getQuestion().getId()))
                    .questionOrder(answer.getSessionQuestion().getQuestionOrder())
                    .questionContent(answer.getSessionQuestion().getQuestion().getContent())
                    .answerText(answer.getAnswerText())
                    .interviewerEmotion(answer.getInterviewerEmotion())
                    .scoreTotal(answer.getScoreTotal())
                    .followupReason(answer.getFollowupReason())
                    .answeredAt(answer.getCreatedAt())
                    .build());
        }

        return InterviewSessionTimelineResponse.builder()
                .sessionId(String.valueOf(session.getId()))
                .jobRole(session.getJobRole())
                .interviewerCharacter(session.getInterviewerCharacter())
                .sessionStatus(session.getStatus())
                .endReason(session.getEndReason())
                .summary(InterviewSessionTimelineResponse.TimelineSummary.builder()
                        .pressureCount(pressureCount)
                        .encourageCount(encourageCount)
                        .neutralCount(neutralCount)
                        .scoredCount(scoredCount)
                        .averageScore(scoredCount > 0 ? Math.round((scoreSum / scoredCount) * 10.0) / 10.0 : null)
                        .build())
                .items(items)
                .build();
    }
}
