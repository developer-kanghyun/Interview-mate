package com.interviewmate.application.ai.usecase;

import com.interviewmate.application.ai.port.AiChatPort;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

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
                "Spring Boot",
                "jobseeker",
                "트랜잭션과 락을 설명해보세요.",
                "데이터 정합성을 위해 트랜잭션을 사용합니다.",
                "이전 답변 요약",
                "jet"
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
                "Spring Boot",
                "jobseeker",
                "트랜잭션과 락을 설명해보세요.",
                "잘 모르겠습니다.",
                "이전 답변 요약",
                "luna"
        );

        assertThat(followupQuestion).contains("핵심 근거");
    }

    @Test
    void testExecuteBuildsCharacterSpecificPromptGuide() {
        AiChatPort aiChatPort = mock(AiChatPort.class);
        when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenReturn("핵심 개념을 한 가지 예시와 함께 설명해 주세요.");

        GenerateFollowupQuestionUseCase useCase = new GenerateFollowupQuestionUseCase(aiChatPort);

        useCase.execute(
                "pm",
                "PRD",
                "jobseeker",
                "우선순위를 어떻게 정하나요?",
                "impact effort로 정합니다.",
                "이전 답변 요약",
                "jet"
        );

        ArgumentCaptor<String> systemPromptCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiChatPort).requestSingleResponse(systemPromptCaptor.capture(), anyString());
        assertThat(systemPromptCaptor.getValue()).contains("캐릭터: 제트");
        assertThat(systemPromptCaptor.getValue()).contains("꼬리질문 규칙");
    }

    @Test
    void testExecuteIncludesIronToneGuideInPrompt() {
        AiChatPort aiChatPort = mock(AiChatPort.class);
        when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenReturn("핵심 실패 원인을 기준으로 동시성 대응 전략을 다시 설명해 주세요.");

        GenerateFollowupQuestionUseCase useCase = new GenerateFollowupQuestionUseCase(aiChatPort);
        useCase.execute(
                "backend",
                "Spring Boot",
                "junior",
                "트랜잭션과 락을 설명해보세요.",
                "잘 모르겠습니다.",
                "이전 답변 요약",
                "iron"
        );

        ArgumentCaptor<String> systemPromptCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiChatPort).requestSingleResponse(systemPromptCaptor.capture(), anyString());
        assertThat(systemPromptCaptor.getValue()).contains("캐릭터: 아이언");
        assertThat(systemPromptCaptor.getValue()).contains("아이언 추가 가드레일");
    }
}
