package com.interviewmate.application.ai.usecase;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewmate.application.ai.port.AiChatPort;
import com.interviewmate.global.error.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
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
                          {"category":"cs","difficulty":"hard","content":"Spring Boot API에서 REST 상태코드 선택 기준을 설명해보세요."},
                          {"category":"job","difficulty":"easy","content":"Spring Boot 기반 캐시 무효화 전략을 설명해보세요."}
                        ]
                        """);

        List<GenerateSessionQuestionPlanUseCase.GeneratedQuestion> result = useCase.execute("backend", "Spring Boot", "jobseeker", 3);

        assertThat(result).hasSize(3);
        assertThat(result.get(0).category()).isEqualTo("job");
        assertThat(result.get(1).category()).isEqualTo("cs");
        assertThat(result)
                .extracting(GenerateSessionQuestionPlanUseCase.GeneratedQuestion::difficulty)
                .containsExactly("easy", "easy", "easy");
    }

    @Test
    void executeRetriesAndSucceedsOnSecondAttempt() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenThrow(new RuntimeException("timeout"))
                .thenReturn("""
                        [
                          {"category":"job","difficulty":"hard","content":"React Native에서 상태 동기화 전략을 설명해보세요."},
                          {"category":"job","difficulty":"hard","content":"React Native에서 렌더링 병목 진단 순서를 설명해보세요."},
                          {"category":"cs","difficulty":"hard","content":"React Native 앱에서 이벤트 루프가 UX에 미치는 영향을 설명해보세요."}
                        ]
                        """);

        List<GenerateSessionQuestionPlanUseCase.GeneratedQuestion> result =
                useCase.execute("app", "React Native", "junior", 3);

        assertThat(result).hasSize(3);
        verify(aiChatPort, times(2)).requestSingleResponse(anyString(), anyString());
    }

    @Test
    void executeThrowsWhenAllAttemptsFail() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenThrow(new RuntimeException("timeout"));

        assertThatThrownBy(() -> useCase.execute("backend", "Spring Boot", "jobseeker", 3))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("질문 생성이 지연");

        verify(aiChatPort, times(3)).requestSingleResponse(anyString(), anyString());
    }

    @Test
    void executeRequiresAllQuestionsToContainSelectedStack() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenReturn("""
                        [
                          {"category":"job","difficulty":"medium","content":"웹 접근성 체크리스트를 설명해보세요."},
                          {"category":"job","difficulty":"medium","content":"네트워크 레이턴시를 줄이는 방법을 설명해보세요."},
                          {"category":"cs","difficulty":"medium","content":"컴포넌트 설계 기준을 설명해보세요."}
                        ]
                        """)
                .thenThrow(new RuntimeException("timeout"))
                .thenThrow(new RuntimeException("timeout"));

        assertThatThrownBy(() -> useCase.execute("frontend", "React,Next.js", "jobseeker", 3))
                .isInstanceOf(AppException.class);
    }

    @Test
    void executeEnforcesJuniorDifficultyProfileDistribution() {
        when(aiChatPort.requestSingleResponse(anyString(), anyString()))
                .thenReturn("""
                        [
                          {"category":"job","difficulty":"hard","content":"Django 서비스에서 API 버전 관리 전략을 설명해보세요."},
                          {"category":"job","difficulty":"hard","content":"Django ORM 성능 문제를 진단하는 순서를 설명해보세요."},
                          {"category":"job","difficulty":"hard","content":"Django 트랜잭션 경계 설계 기준을 설명해보세요."},
                          {"category":"job","difficulty":"hard","content":"Django 캐시 무효화 전략을 설명해보세요."},
                          {"category":"cs","difficulty":"hard","content":"Django 앱에서 데이터 일관성 보장 방법을 설명해보세요."},
                          {"category":"cs","difficulty":"hard","content":"Django 서비스에서 비동기 처리 도입 기준을 설명해보세요."},
                          {"category":"job","difficulty":"hard","content":"Django 배포 롤백 전략을 설명해보세요."}
                        ]
                        """);

        List<GenerateSessionQuestionPlanUseCase.GeneratedQuestion> result =
                useCase.execute("backend", "Django", "junior", 7);

        long easyCount = result.stream().filter(item -> "easy".equals(item.difficulty())).count();
        long mediumCount = result.stream().filter(item -> "medium".equals(item.difficulty())).count();
        long hardCount = result.stream().filter(item -> "hard".equals(item.difficulty())).count();

        assertThat(easyCount).isEqualTo(2);
        assertThat(mediumCount).isEqualTo(3);
        assertThat(hardCount).isEqualTo(2);
    }
}
