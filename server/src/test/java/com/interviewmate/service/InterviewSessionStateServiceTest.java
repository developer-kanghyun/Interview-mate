package com.interviewmate.service;

import com.interviewmate.dto.response.LatestActiveSessionResponse;
import com.interviewmate.repository.InterviewAnswerRepository;
import com.interviewmate.repository.InterviewQuestionRepository;
import com.interviewmate.repository.InterviewSessionQuestionRepository;
import com.interviewmate.repository.InterviewSessionRepository;
import com.interviewmate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class InterviewSessionStateServiceTest {

    @Autowired
    private InterviewSessionStateService interviewSessionStateService;

    @Autowired
    private InterviewAnswerRepository interviewAnswerRepository;

    @Autowired
    private InterviewSessionQuestionRepository interviewSessionQuestionRepository;

    @Autowired
    private InterviewSessionRepository interviewSessionRepository;

    @Autowired
    private InterviewQuestionRepository interviewQuestionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

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
        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (900, 'backend', 'job', 'medium', '트랜잭션의 ACID를 설명해보세요.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
    }

    @Test
    void testGetLatestActiveSessionReturnsFalseWhenNoSession() {
        LatestActiveSessionResponse response = interviewSessionStateService.getLatestActiveSession(1L);
        assertThat(response.isHasActiveSession()).isFalse();
        assertThat(response.getSession()).isNull();
    }

    @Test
    void testGetLatestActiveSessionReturnsSessionWhenInProgressExists() {
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, stack, difficulty, interviewer_character, total_questions, status, started_at, created_at, updated_at)
                VALUES (77, 1, 'backend', 'Spring Boot,Redis', 'junior', 'jet', 7, 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_session_questions (id, session_id, question_id, question_order, followup_count, created_at)
                VALUES (7700, 77, 900, 1, 0, CURRENT_TIMESTAMP)
                """);

        LatestActiveSessionResponse response = interviewSessionStateService.getLatestActiveSession(1L);

        assertThat(response.isHasActiveSession()).isTrue();
        assertThat(response.getSession()).isNotNull();
        assertThat(response.getSession().getSessionId()).isEqualTo("77");
        assertThat(response.getSession().getStack()).isEqualTo("Spring Boot,Redis");
        assertThat(response.getSession().getDifficulty()).isEqualTo("junior");
        assertThat(response.getSession().getInterviewerCharacter()).isEqualTo("jet");
        assertThat(response.getSession().getEndReason()).isNull();
        assertThat(response.getSession().getRemainingQuestions()).isEqualTo(7);
        assertThat(response.getSession().getCompletionRate()).isEqualTo(0.0);
        assertThat(response.getSession().getCurrentQuestion()).isNotNull();
        assertThat(response.getSession().getCurrentQuestion().getQuestionId()).isEqualTo("900");
    }

    @Test
    void testGetSessionStateDoesNotCountQuestionAsCompletedDuringFollowup() {
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, stack, difficulty, interviewer_character, total_questions, status, started_at, created_at, updated_at)
                VALUES (88, 1, 'backend', 'Spring Boot', 'jobseeker', 'jet', 7, 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_session_questions (id, session_id, question_id, question_order, followup_count, created_at)
                VALUES (8800, 88, 900, 1, 1, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_answers (id, session_question_id, answer_text, input_type, created_at)
                VALUES (88001, 8800, '첫 답변', 'text', CURRENT_TIMESTAMP)
                """);

        var state = interviewSessionStateService.getSessionState(88L, 1L);

        assertThat(state.getAnsweredQuestions()).isEqualTo(0);
        assertThat(state.getRemainingQuestions()).isEqualTo(7);
        assertThat(state.getCompletionRate()).isEqualTo(0.0);
        assertThat(state.getCurrentQuestion()).isNotNull();
        assertThat(state.getCurrentQuestion().getQuestionId()).isEqualTo("900");
        assertThat(state.getCurrentQuestion().getFollowupCount()).isEqualTo(1);
        assertThat(state.getStack()).isEqualTo("Spring Boot");
        assertThat(state.getDifficulty()).isEqualTo("jobseeker");
    }

    @Test
    void testGetSessionStateIncludesEndReason() {
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, stack, difficulty, interviewer_character, total_questions, status, end_reason, started_at, created_at, updated_at)
                VALUES (89, 1, 'backend', 'Spring Boot', 'jobseeker', 'jet', 7, 'completed', 'user_end', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_session_questions (id, session_id, question_id, question_order, followup_count, created_at)
                VALUES (8900, 89, 900, 1, 0, CURRENT_TIMESTAMP)
                """);

        var state = interviewSessionStateService.getSessionState(89L, 1L);

        assertThat(state.getStatus()).isEqualTo("completed");
        assertThat(state.getEndReason()).isEqualTo("user_end");
    }
}
