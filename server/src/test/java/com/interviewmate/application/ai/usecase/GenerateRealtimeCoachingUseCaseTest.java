package com.interviewmate.application.ai.usecase;

import com.interviewmate.application.ai.port.AiChatPort;
import com.interviewmate.domain.ai.AnswerEvaluationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GenerateRealtimeCoachingUseCaseTest {

    @Mock
    private AiChatPort aiChatPort;

    private GenerateRealtimeCoachingUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new GenerateRealtimeCoachingUseCase(aiChatPort);
    }

    @Test
    void executeUsesAiMessageWhenAvailable() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenReturn("강점은 명확합니다. 다음 답변은 근거를 먼저 말해보세요.");

        String result = useCase.execute(
                "backend",
                "Spring Boot",
                "jobseeker",
                "질문",
                "답변",
                evaluation(false, "none"),
                "none"
        );

        assertThat(result).contains("강점");
    }

    @Test
    void executeFallsBackWhenAiFails() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenThrow(new RuntimeException("api-failed-1"))
                .thenThrow(new RuntimeException("api-failed-2"));

        String result = useCase.execute(
                "backend",
                "Spring Boot",
                "jobseeker",
                "질문",
                "잘 모르겠습니다.",
                evaluation(true, "weak_reasoning"),
                "weak_reasoning"
        );

        assertThat(result).contains("다음 답변");
        verify(aiChatPort, times(2)).requestSingleResponse(anyString(), anyString());
    }

    @Test
    void executeRetriesAndUsesSecondAiResponse() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenThrow(new RuntimeException("api-failed-1"))
                .thenReturn("개념 요약은 좋았습니다. 다음 답변에서는 결론-근거-예시 순서를 유지해보세요.");

        String result = useCase.execute(
                "backend",
                "Spring Boot",
                "jobseeker",
                "질문",
                "답변",
                evaluation(false, "핵심 근거 제시는 충분했습니다."),
                "핵심 근거 제시는 충분했습니다."
        );

        assertThat(result).contains("결론-근거-예시");
        verify(aiChatPort, times(2)).requestSingleResponse(anyString(), anyString());
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
