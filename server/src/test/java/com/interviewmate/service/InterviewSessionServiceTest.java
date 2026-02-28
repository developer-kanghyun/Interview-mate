package com.interviewmate.service;

import com.interviewmate.application.ai.usecase.GenerateSessionQuestionPlanUseCase;
import com.interviewmate.dto.request.InterviewSessionStartRequest;
import com.interviewmate.dto.response.InterviewSessionStartResponse;
import com.interviewmate.global.error.AppException;
import com.interviewmate.repository.InterviewQuestionRepository;
import com.interviewmate.repository.InterviewSessionQuestionRepository;
import com.interviewmate.repository.InterviewSessionRepository;
import com.interviewmate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class InterviewSessionServiceTest {

    @Autowired
    private InterviewSessionService interviewSessionService;

    @Autowired
    private InterviewSessionRepository interviewSessionRepository;

    @Autowired
    private InterviewSessionQuestionRepository interviewSessionQuestionRepository;

    @Autowired
    private InterviewQuestionRepository interviewQuestionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockBean
    private GenerateSessionQuestionPlanUseCase generateSessionQuestionPlanUseCase;

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create");
        registry.add("app.rate-limit.enabled", () -> "false");
    }

    @BeforeEach
    void setUp() {
        interviewSessionQuestionRepository.deleteAll();
        interviewSessionRepository.deleteAll();
        interviewQuestionRepository.deleteAll();
        userRepository.deleteAll();

        jdbcTemplate.update("INSERT INTO users (id, api_key, created_at, updated_at) VALUES (1, 'test-key', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
    }

    @Test
    void testStartSessionSavesInterviewSessionWithAiGeneratedQuestions() {
        when(generateSessionQuestionPlanUseCase.execute(eq("backend"), eq("Spring Boot"), eq("jobseeker"), eq(7)))
                .thenReturn(buildQuestionPlan(7));

        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");
        request.setStack("Spring Boot");
        request.setDifficulty("jobseeker");

        InterviewSessionStartResponse response = interviewSessionService.startSession(request, 1L);

        assertThat(response.getSessionId()).isNotBlank();
        assertThat(response.getJobRole()).isEqualTo("backend");
        assertThat(response.getInterviewerCharacter()).isEqualTo("jet");
        assertThat(response.getTotalQuestions()).isEqualTo(7);
        assertThat(response.getFirstQuestion().getContent()).contains("질문 1");
        assertThat(interviewSessionRepository.count()).isEqualTo(1);
        assertThat(interviewSessionQuestionRepository.count()).isEqualTo(7);
        assertThat(interviewQuestionRepository.count()).isEqualTo(7);

        verify(generateSessionQuestionPlanUseCase).execute("backend", "Spring Boot", "jobseeker", 7);
    }

    @Test
    void testStartSessionUsesRequestedInterviewerCharacter() {
        when(generateSessionQuestionPlanUseCase.execute(eq("backend"), eq("Spring Boot"), eq("jobseeker"), eq(7)))
                .thenReturn(buildQuestionPlan(7));

        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");
        request.setStack("Spring Boot");
        request.setDifficulty("jobseeker");
        request.setInterviewerCharacter("iron");

        InterviewSessionStartResponse response = interviewSessionService.startSession(request, 1L);

        assertThat(response.getInterviewerCharacter()).isEqualTo("iron");
    }

    @Test
    void testStartSessionLimitsGuestPreviewToOneQuestion() {
        jdbcTemplate.update("INSERT INTO users (id, api_key, is_guest, created_at, updated_at) VALUES (2, 'guest-key', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
        when(generateSessionQuestionPlanUseCase.execute(eq("frontend"), eq("Next.js"), eq("junior"), eq(1)))
                .thenReturn(buildQuestionPlan(1));

        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("frontend");
        request.setStack("Next.js");
        request.setDifficulty("junior");

        InterviewSessionStartResponse response = interviewSessionService.startSession(request, 2L);

        assertThat(response.getTotalQuestions()).isEqualTo(1);
        assertThat(interviewSessionQuestionRepository.count()).isEqualTo(1);
        verify(generateSessionQuestionPlanUseCase).execute("frontend", "Next.js", "junior", 1);
    }

    @Test
    void testStartSessionThrowsWhenQuestionPlanIsEmpty() {
        when(generateSessionQuestionPlanUseCase.execute(eq("backend"), eq("Spring Boot"), eq("jobseeker"), eq(7)))
                .thenReturn(List.of());

        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");
        request.setStack("Spring Boot");
        request.setDifficulty("jobseeker");

        assertThatThrownBy(() -> interviewSessionService.startSession(request, 1L))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("면접 질문 생성에 실패했습니다");
    }

    private List<GenerateSessionQuestionPlanUseCase.GeneratedQuestion> buildQuestionPlan(int count) {
        return java.util.stream.IntStream.rangeClosed(1, count)
                .mapToObj(index -> new GenerateSessionQuestionPlanUseCase.GeneratedQuestion(
                        index <= Math.max(1, count - 2) ? "job" : "cs",
                        index <= 2 ? "easy" : "medium",
                        "백엔드 핵심 질문 " + index
                ))
                .toList();
    }
}
