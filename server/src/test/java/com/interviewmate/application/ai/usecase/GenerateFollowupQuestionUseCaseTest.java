package com.interviewmate.application.ai.usecase;

import com.interviewmate.application.ai.port.AiChatPort;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.doThrow;

class GenerateFollowupQuestionUseCaseTest {

    @Test
    void testExecuteReturnsFollowupQuestion() {
        AiChatPort aiChatPort = mock(AiChatPort.class);
        when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenReturn("트랜잭션 격리수준을 선택한 이유를 설명해 주세요.");

        GenerateFollowupQuestionUseCase useCase = new GenerateFollowupQuestionUseCase(aiChatPort);

        String followupQuestion = useCase.execute(
                "backend",
                "트랜잭션과 락을 설명해보세요.",
                "데이터 정합성을 위해 트랜잭션을 사용합니다."
        );

        assertThat(followupQuestion).contains("트랜잭션");
        verify(aiChatPort).requestSingleResponse(anyString(), anyString());
    }

    @Test
    void testExecuteReturnsFallbackWhenAiFails() {
        AiChatPort aiChatPort = mock(AiChatPort.class);
        doThrow(new RuntimeException("network error"))
                .when(aiChatPort).requestSingleResponse(anyString(), anyString());

        GenerateFollowupQuestionUseCase useCase = new GenerateFollowupQuestionUseCase(aiChatPort);

        String followupQuestion = useCase.execute(
                "backend",
                "트랜잭션과 락을 설명해보세요.",
                "잘 모르겠습니다."
        );

        assertThat(followupQuestion).contains("핵심 근거");
    }
}
