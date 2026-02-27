package com.interviewmate.application.ai.usecase;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewmate.application.ai.port.AiChatPort;
import com.interviewmate.domain.ai.AnswerEvaluationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GenerateRealtimeCoachingUseCaseTest {

    @Mock
    private AiChatPort aiChatPort;

    private GenerateRealtimeCoachingUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new GenerateRealtimeCoachingUseCase(aiChatPort, new ObjectMapper());
    }

    @Test
    void executeUsesAiMessageWhenAvailable() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenReturn("""
                        {
                          "summary": "핵심 흐름은 명확합니다.",
                          "coaching": "다음 답변에서는 근거를 먼저 제시해 보세요."
                        }
                        """);

        GenerateRealtimeCoachingUseCase.RealtimeCoachingResult result = useCase.execute(
                "backend",
                "Spring Boot",
                "jobseeker",
                "질문",
                "답변",
                evaluation(false, "none"),
                "none",
                "luna"
        );

        assertThat(result.coachingAvailable()).isTrue();
        assertThat(result.feedbackSummary()).contains("핵심 흐름");
        assertThat(result.coachingMessage()).contains("근거");
    }

    @Test
    void executeFallsBackWhenAiFails() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString())).thenThrow(new RuntimeException("api-failed"));

        GenerateRealtimeCoachingUseCase.RealtimeCoachingResult result = useCase.execute(
                "backend",
                "Spring Boot",
                "jobseeker",
                "질문",
                "잘 모르겠습니다.",
                evaluation(true, "weak_reasoning"),
                "weak_reasoning",
                "jet"
        );

        assertThat(result.coachingAvailable()).isFalse();
        assertThat(result.feedbackSummary()).isNull();
        assertThat(result.coachingMessage()).isNull();
    }

    @Test
    void executeIncludesIronGuardrailInPrompt() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenReturn("""
                        {
                          "summary": "핵심이 부족합니다.",
                          "coaching": "근거를 먼저 말해보세요."
                        }
                        """);

        useCase.execute(
                "backend",
                "Spring Boot",
                "junior",
                "질문",
                "답변",
                evaluation(true, "weak_reasoning"),
                "weak_reasoning",
                "iron"
        );

        ArgumentCaptor<String> systemPromptCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiChatPort).requestSingleResponse(systemPromptCaptor.capture(), anyString());
        assertThat(systemPromptCaptor.getValue()).contains("캐릭터: 아이언");
        assertThat(systemPromptCaptor.getValue()).contains("아이언 추가 가드레일");
        assertThat(systemPromptCaptor.getValue()).contains("비난, 조롱");
    }

    private AnswerEvaluationResult evaluation(boolean followupRequired, String followupReason) {
        return AnswerEvaluationResult.builder()
                .accuracy(2.0)
                .logic(2.2)
                .depth(2.1)
                .delivery(2.3)
                .totalScore(2.1)
                .followupRequired(followupRequired)
                .followupReason(followupReason)
                .build();
    }
}
