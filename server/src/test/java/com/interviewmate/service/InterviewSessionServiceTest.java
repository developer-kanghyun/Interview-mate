package com.interviewmate.service;

import com.interviewmate.application.ai.usecase.GenerateSessionQuestionPlanUseCase;
import com.interviewmate.dto.request.InterviewSessionStartRequest;
import com.interviewmate.dto.response.InterviewSessionStartResponse;
import com.interviewmate.global.error.AppException;
import com.interviewmate.global.error.ErrorCode;
import com.interviewmate.repository.InterviewAnswerRepository;
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
import static org.mockito.Mockito.verifyNoInteractions;
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
    private InterviewAnswerRepository interviewAnswerRepository;

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
        interviewAnswerRepository.deleteAll();
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

    @Test
    void testStartSessionWeakFirstPrioritizesWeakQuestionsThenGeneratesRemainder() {
        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (410, 'backend', 'job', 'easy', '약점 질문 낮은 점수', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (411, 'backend', 'job', 'medium', '강점 질문', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (412, 'backend', 'cs', 'medium', '약점 질문 꼬리질문', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, stack, difficulty, interviewer_character, total_questions, status, started_at, created_at, updated_at)
                VALUES (40, 1, 'backend', 'Spring Boot', 'jobseeker', 'jet', 3, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_session_questions (id, session_id, question_id, question_order, followup_count, created_at)
                VALUES (4100, 40, 410, 1, 0, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_session_questions (id, session_id, question_id, question_order, followup_count, created_at)
                VALUES (4101, 40, 411, 2, 0, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_session_questions (id, session_id, question_id, question_order, followup_count, created_at)
                VALUES (4102, 40, 412, 3, 0, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_answers (
                    id, session_question_id, answer_text, input_type, interviewer_emotion,
                    score_accuracy, score_logic, score_depth, score_delivery, score_total,
                    followup_required, followup_reason, coaching_message, created_at
                ) VALUES (
                    6100, 4100, '답변1', 'text', 'pressure',
                    2.1, 2.3, 2.5, 2.7, 2.4,
                    false, 'none', '개선 필요', CURRENT_TIMESTAMP
                )
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_answers (
                    id, session_question_id, answer_text, input_type, interviewer_emotion,
                    score_accuracy, score_logic, score_depth, score_delivery, score_total,
                    followup_required, followup_reason, coaching_message, created_at
                ) VALUES (
                    6101, 4101, '답변2', 'text', 'encourage',
                    4.2, 4.1, 4.0, 4.0, 4.1,
                    false, 'none', '좋음', CURRENT_TIMESTAMP
                )
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_answers (
                    id, session_question_id, answer_text, input_type, interviewer_emotion,
                    score_accuracy, score_logic, score_depth, score_delivery, score_total,
                    followup_required, followup_reason, coaching_message, created_at
                ) VALUES (
                    6102, 4102, '답변3', 'text', 'pressure',
                    3.6, 3.7, 3.5, 3.3, 3.5,
                    true, 'weak_reasoning', '추가 연습 필요', CURRENT_TIMESTAMP
                )
                """);

        when(generateSessionQuestionPlanUseCase.execute(eq("backend"), eq("Spring Boot"), eq("jobseeker"), eq(5)))
                .thenReturn(buildQuestionPlan(5));

        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");
        request.setStack("Spring Boot");
        request.setDifficulty("jobseeker");
        request.setRetryMode("weak_first");
        request.setSourceSessionId(40L);

        InterviewSessionStartResponse response = interviewSessionService.startSession(request, 1L);

        assertThat(response.getTotalQuestions()).isEqualTo(7);

        Long newSessionId = Long.valueOf(response.getSessionId());
        List<String> contents = jdbcTemplate.queryForList("""
                SELECT q.content
                FROM interview_session_questions sq
                JOIN interview_questions q ON q.id = sq.question_id
                WHERE sq.session_id = ?
                ORDER BY sq.question_order ASC
                """, String.class, newSessionId);

        assertThat(contents).hasSize(7);
        assertThat(contents.get(0)).isEqualTo("약점 질문 낮은 점수");
        assertThat(contents.get(1)).isEqualTo("약점 질문 꼬리질문");
        assertThat(contents.get(2)).contains("백엔드 핵심 질문");
        verify(generateSessionQuestionPlanUseCase).execute("backend", "Spring Boot", "jobseeker", 5);
    }

    @Test
    void testStartSessionWeakFirstThrowsWhenSourceSessionIdMissing() {
        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");
        request.setStack("Spring Boot");
        request.setDifficulty("jobseeker");
        request.setRetryMode("weak_first");

        assertThatThrownBy(() -> interviewSessionService.startSession(request, 1L))
                .isInstanceOf(AppException.class)
                .extracting(error -> ((AppException) error).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INPUT);

        verifyNoInteractions(generateSessionQuestionPlanUseCase);
    }

    @Test
    void testStartSessionWeakFirstThrowsWhenSourceSessionNotCompleted() {
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, stack, difficulty, interviewer_character, total_questions, status, started_at, created_at, updated_at)
                VALUES (41, 1, 'backend', 'Spring Boot', 'jobseeker', 'jet', 3, 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");
        request.setStack("Spring Boot");
        request.setDifficulty("jobseeker");
        request.setRetryMode("weak_first");
        request.setSourceSessionId(41L);

        assertThatThrownBy(() -> interviewSessionService.startSession(request, 1L))
                .isInstanceOf(AppException.class)
                .extracting(error -> ((AppException) error).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INPUT);

        verifyNoInteractions(generateSessionQuestionPlanUseCase);
    }

    @Test
    void testStartSessionWeakFirstThrowsWhenSourceSessionOwnedByAnotherUser() {
        jdbcTemplate.update("INSERT INTO users (id, api_key, created_at, updated_at) VALUES (3, 'user3-key', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, stack, difficulty, interviewer_character, total_questions, status, started_at, created_at, updated_at)
                VALUES (42, 3, 'backend', 'Spring Boot', 'jobseeker', 'jet', 3, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");
        request.setStack("Spring Boot");
        request.setDifficulty("jobseeker");
        request.setRetryMode("weak_first");
        request.setSourceSessionId(42L);

        assertThatThrownBy(() -> interviewSessionService.startSession(request, 1L))
                .isInstanceOf(AppException.class)
                .extracting(error -> ((AppException) error).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_INPUT);

        verifyNoInteractions(generateSessionQuestionPlanUseCase);
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
