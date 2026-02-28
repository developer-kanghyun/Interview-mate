package com.interviewmate.service;

import com.interviewmate.dto.response.InterviewSessionReportResponse;
import com.interviewmate.dto.response.InterviewSessionStudyResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InterviewSessionStudyServiceTest {

    @Mock
    private InterviewSessionReportService interviewSessionReportService;

    private InterviewSessionStudyService interviewSessionStudyService;

    @BeforeEach
    void setUp() {
        interviewSessionStudyService = new InterviewSessionStudyService(interviewSessionReportService);
    }

    @Test
    void testGetStudyGuideBuildsRecommendedActionsAndPreview() {
        String longModelAnswer = "A".repeat(260);
        InterviewSessionReportResponse reportResponse = InterviewSessionReportResponse.builder()
                .sessionId("7")
                .jobRole("backend")
                .performanceLevel("needs_improvement")
                .priorityFocuses(List.of("정확성", "깊이"))
                .weakKeywords(List.of("핵심 개념 정의", "트레이드오프"))
                .questions(List.of(
                        InterviewSessionReportResponse.QuestionReport.builder()
                                .questionOrder(1)
                                .questionContent("질문")
                                .interviewerEmotion("neutral")
                                .weakConceptKeywords(List.of("핵심 개념 정의"))
                                .modelAnswer(longModelAnswer)
                                .coachingMessage("핵심 개념을 먼저 1문장으로 답하세요.")
                                .improvementTip("개선 팁")
                                .build()
                ))
                .build();

        when(interviewSessionReportService.getSessionReport(7L, 1L)).thenReturn(reportResponse);

        InterviewSessionStudyResponse result = interviewSessionStudyService.getStudyGuide(7L, 1L);

        assertThat(result.getSessionId()).isEqualTo("7");
        assertThat(result.getRecommendedActions()).isNotEmpty();
        assertThat(result.getRecommendedActions()).hasSize(1);
        assertThat(result.getRecommendedActions().get(0)).contains("핵심 개념 정의");
        assertThat(result.getQuestionGuides()).hasSize(1);
        assertThat(result.getQuestionGuides().get(0).getInterviewerEmotion()).isEqualTo("neutral");
        assertThat(result.getQuestionGuides().get(0).getActionTip()).contains("핵심 개념");
        assertThat(result.getQuestionGuides().get(0).getModelAnswerPreview()).endsWith("...");
        assertThat(result.getQuestionGuides().get(0).getModelAnswerPreview().length()).isLessThanOrEqualTo(223);
    }
}
