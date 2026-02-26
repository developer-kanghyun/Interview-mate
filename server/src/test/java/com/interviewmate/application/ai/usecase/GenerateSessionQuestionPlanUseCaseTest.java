package com.interviewmate.application.ai.usecase;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewmate.application.ai.port.AiChatPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GenerateSessionQuestionPlanUseCaseTest {

    @Mock
    private AiChatPort aiChatPort;

    private GenerateSessionQuestionPlanUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new GenerateSessionQuestionPlanUseCase(aiChatPort, new ObjectMapper());
    }

    @Test
    void executeParsesGeneratedJsonArray() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenReturn("""
                        [
                          {"category":"job","difficulty":"medium","content":"Spring Boot 트랜잭션 전파 전략을 설명해보세요."},
                          {"category":"cs","difficulty":"easy","content":"Spring Boot API에서 REST 상태코드 선택 기준을 설명해보세요."},
                          {"category":"job","difficulty":"hard","content":"Spring Boot 기반 캐시 무효화 전략을 설계해보세요."}
                        ]
                        """);

        List<GenerateSessionQuestionPlanUseCase.GeneratedQuestion> result = useCase.execute("backend", "Spring Boot", "jobseeker", 3);

        assertThat(result).hasSize(3);
        assertThat(result.get(0).category()).isEqualTo("job");
        assertThat(result.get(1).category()).isEqualTo("cs");
        assertThat(result.get(2).difficulty()).isEqualTo("hard");
    }

    @Test
    void executeFallsBackWhenAiFails() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString())).thenThrow(new RuntimeException("timeout"));

        List<GenerateSessionQuestionPlanUseCase.GeneratedQuestion> result = useCase.execute("frontend", "Next.js", "junior", 4);

        assertThat(result).hasSize(4);
        assertThat(result.get(0).content()).contains("Next.js");
    }

    @Test
    void executeFillsMissingItemsWithFallback() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenReturn("[{\"category\":\"job\",\"difficulty\":\"medium\",\"content\":\"Spring Boot 단일 질문\"}]");

        List<GenerateSessionQuestionPlanUseCase.GeneratedQuestion> result = useCase.execute("backend", "Spring Boot", "jobseeker", 3);

        assertThat(result).hasSize(3);
        assertThat(result.get(0).content()).contains("Spring Boot 단일 질문");
    }

    @Test
    void executeFiltersOutQuestionsThatDoNotReferenceSelectedStacks() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenReturn("""
                        [
                          {"category":"job","difficulty":"medium","content":"React에서 상태를 로컬/전역/서버 상태로 분리하는 기준을 설명해보세요."},
                          {"category":"job","difficulty":"medium","content":"웹 접근성 체크리스트를 설명해보세요."},
                          {"category":"cs","difficulty":"medium","content":"네트워크 레이턴시를 줄이는 방법을 설명해보세요."}
                        ]
                        """);

        List<GenerateSessionQuestionPlanUseCase.GeneratedQuestion> result = useCase.execute("frontend", "Kotlin,Swift,React Native", "jobseeker", 3);

        assertThat(result).hasSize(3);
        assertThat(result)
                .extracting(GenerateSessionQuestionPlanUseCase.GeneratedQuestion::content)
                .allMatch(content -> content.contains("Kotlin") || content.contains("Swift") || content.contains("React Native"));
    }
}
