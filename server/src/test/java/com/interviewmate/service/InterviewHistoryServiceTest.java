package com.interviewmate.service;

import com.interviewmate.dto.response.InterviewHistoryResponse;
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
class InterviewHistoryServiceTest {

    @Autowired
    private InterviewHistoryService interviewHistoryService;

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
                VALUES (401, 'backend', 'cs', 'easy', 'REST와 RPC 차이를 설명해보세요.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, interviewer_character, total_questions, status, started_at, created_at, updated_at)
                VALUES (40, 1, 'backend', 'jet', 1, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_session_questions (id, session_id, question_id, question_order, followup_count, created_at)
                VALUES (4001, 40, 401, 1, 0, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_answers (id, session_question_id, answer_text, input_type, interviewer_emotion, created_at)
                VALUES (7001, 4001, 'REST는 리소스 중심, RPC는 함수 호출 중심입니다.', 'text', 'encourage', CURRENT_TIMESTAMP)
                """);
    }

    @Test
    void testGetHistoryReturnsItemsWithScores() {
        InterviewHistoryResponse response = interviewHistoryService.getHistory(1L, 30);

        assertThat(response.getRequestedDays()).isEqualTo(30);
        assertThat(response.getTotalCount()).isEqualTo(1);
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getSessionId()).isEqualTo("40");
        assertThat(response.getItems().get(0).getSessionEndReason()).isNull();
        assertThat(response.getItems().get(0).getInterviewerEmotion()).isEqualTo("encourage");
        assertThat(response.getItems().get(0).getTotalScore()).isGreaterThan(0.0);
    }

    @Test
    void testGetHistoryUsesDefaultLookbackDaysWhenDaysIsNull() {
        InterviewHistoryResponse response = interviewHistoryService.getHistory(1L, null);

        assertThat(response.getRequestedDays()).isEqualTo(30);
        assertThat(response.getTotalCount()).isEqualTo(1);
    }

    @Test
    void testGetHistoryIncludesSessionEndReason() {
        jdbcTemplate.update("UPDATE interview_sessions SET end_reason = 'user_end' WHERE id = 40");

        InterviewHistoryResponse response = interviewHistoryService.getHistory(1L, 30);

        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getSessionEndReason()).isEqualTo("user_end");
    }
}
