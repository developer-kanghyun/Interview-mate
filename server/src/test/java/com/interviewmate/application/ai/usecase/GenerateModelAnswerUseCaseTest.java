package com.interviewmate.application.ai.usecase;

import com.interviewmate.application.ai.port.AiChatPort;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;

class GenerateModelAnswerUseCaseTest {

    @Test
    void testExecuteReturnsGeneratedAnswer() {
        AiChatPort aiChatPort = Mockito.mock(AiChatPort.class);
        Mockito.when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenReturn("트랜잭션 격리 수준은 정합성과 성능의 균형 관점에서 선택해야 합니다.");

        GenerateModelAnswerUseCase useCase = new GenerateModelAnswerUseCase(aiChatPort);
        String result = useCase.execute("backend", "트랜잭션 격리 수준을 설명해보세요.");

        assertThat(result).contains("트랜잭션");
    }

    @Test
    void testExecuteReturnsFallbackWhenAiFails() {
        AiChatPort aiChatPort = Mockito.mock(AiChatPort.class);
        Mockito.when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenThrow(new RuntimeException("openai error"));

        GenerateModelAnswerUseCase useCase = new GenerateModelAnswerUseCase(aiChatPort);
        String result = useCase.execute("backend", "REST와 RPC의 차이를 설명해보세요.");

        assertThat(result).contains("모범답안 예시");
        assertThat(result).contains("REST와 RPC");
    }
}
