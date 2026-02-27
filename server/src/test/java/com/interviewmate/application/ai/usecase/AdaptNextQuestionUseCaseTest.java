package com.interviewmate.application.ai.usecase;

import com.interviewmate.application.ai.port.AiChatPort;
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
class AdaptNextQuestionUseCaseTest {

    @Mock
    private AiChatPort aiChatPort;

    private AdaptNextQuestionUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new AdaptNextQuestionUseCase(aiChatPort);
    }

    @Test
    void executeUsesAdaptedQuestionWhenAvailable() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString())).thenReturn("근거가 부족했던 포인트를 중심으로 트랜잭션 격리 수준을 다시 설명해보세요");

        String result = useCase.execute("backend", "Spring Boot", "junior", "트랜잭션 격리 수준을 설명해보세요.", "답변 요약", "jet");

        assertThat(result).isEqualTo("근거가 부족했던 포인트를 중심으로 트랜잭션 격리 수준을 다시 설명해보세요?");
    }

    @Test
    void executeKeepsBaseQuestionWhenAiFails() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString())).thenThrow(new RuntimeException("fail"));

        String baseQuestion = "REST 상태코드 선택 기준을 설명해보세요.";
        String result = useCase.execute("frontend", "Next.js", "jobseeker", baseQuestion, "답변 요약", "luna");

        assertThat(result).isEqualTo(baseQuestion);
    }

    @Test
    void executeIncludesCharacterToneGuideInPrompt() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString())).thenReturn("동시성 충돌 해결 순서를 설명해보세요.");

        useCase.execute("backend", "Spring Boot", "junior", "락 전략을 설명해보세요.", "답변 요약", "iron");

        ArgumentCaptor<String> systemPromptCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiChatPort).requestSingleResponse(systemPromptCaptor.capture(), anyString());
        assertThat(systemPromptCaptor.getValue()).contains("캐릭터: 아이언");
        assertThat(systemPromptCaptor.getValue()).contains("아이언 추가 가드레일");
    }
}
