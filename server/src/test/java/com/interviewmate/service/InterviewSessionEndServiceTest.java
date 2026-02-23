package com.interviewmate.service;

import com.interviewmate.dto.response.InterviewSessionEndResponse;
import com.interviewmate.global.error.AppException;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class InterviewSessionEndServiceTest {

    @Autowired
    private InterviewSessionEndService interviewSessionEndService;

    @Autowired
    private InterviewSessionRepository interviewSessionRepository;

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
        interviewSessionRepository.deleteAll();
        userRepository.deleteAll();
        jdbcTemplate.update("INSERT INTO users (id, api_key, created_at, updated_at) VALUES (1, 'test-key', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
        jdbcTemplate.update("INSERT INTO users (id, api_key, created_at, updated_at) VALUES (2, 'other-key', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
    }

    @Test
    void testEndSessionUpdatesStatusToCompleted() {
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, interviewer_character, total_questions, status, started_at, created_at, updated_at)
                VALUES (10, 1, 'backend', 'jet', 7, 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        InterviewSessionEndResponse result = interviewSessionEndService.endSession(10L, 1L, null);

        var savedRow = jdbcTemplate.queryForMap("SELECT status, end_reason FROM interview_sessions WHERE id = 10");
        assertThat(result.getSessionId()).isEqualTo("10");
        assertThat(result.getSessionStatus()).isEqualTo("completed");
        assertThat(result.getEndReason()).isEqualTo("user_end");
        assertThat(savedRow.get("status")).isEqualTo("completed");
        assertThat(savedRow.get("end_reason")).isEqualTo("user_end");
        assertThat(result.getEndedAt()).isNotNull();
    }

    @Test
    void testEndSessionRejectsOtherUserSession() {
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, interviewer_character, total_questions, status, started_at, created_at, updated_at)
                VALUES (11, 1, 'backend', 'jet', 7, 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        assertThatThrownBy(() -> interviewSessionEndService.endSession(11L, 2L, null))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("세션을 찾을 수 없습니다.");
    }

    @Test
    void testEndSessionRejectsAlreadyCompletedSession() {
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, interviewer_character, total_questions, status, started_at, created_at, updated_at)
                VALUES (12, 1, 'backend', 'jet', 7, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        assertThatThrownBy(() -> interviewSessionEndService.endSession(12L, 1L, null))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("이미 종료된 세션입니다.");
    }

    @Test
    void testEndSessionReturnsFreshEndedAtTimestamp() {
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, interviewer_character, total_questions, status, started_at, created_at, updated_at)
                VALUES (13, 1, 'backend', 'jet', 7, 'in_progress', TIMESTAMP '2025-01-01 00:00:00', TIMESTAMP '2025-01-01 00:00:00', TIMESTAMP '2025-01-01 00:00:00')
                """);

        InterviewSessionEndResponse result = interviewSessionEndService.endSession(13L, 1L, null);

        assertThat(result.getEndedAt()).isAfter(java.time.LocalDateTime.of(2025, 1, 1, 0, 0));
    }

    @Test
    void testEndSessionStoresExplicitReason() {
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, interviewer_character, total_questions, status, started_at, created_at, updated_at)
                VALUES (14, 1, 'backend', 'jet', 7, 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        InterviewSessionEndResponse result = interviewSessionEndService.endSession(14L, 1L, "completed_all_questions");

        String savedReason = jdbcTemplate.queryForObject(
                "SELECT end_reason FROM interview_sessions WHERE id = 14",
                String.class
        );
        assertThat(result.getEndReason()).isEqualTo("completed_all_questions");
        assertThat(savedReason).isEqualTo("completed_all_questions");
    }
}
