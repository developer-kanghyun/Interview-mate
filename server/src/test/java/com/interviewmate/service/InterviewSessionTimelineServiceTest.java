package com.interviewmate.service;

import com.interviewmate.dto.response.InterviewSessionTimelineResponse;
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
class InterviewSessionTimelineServiceTest {

    @Autowired
    private InterviewSessionTimelineService interviewSessionTimelineService;

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
                VALUES (501, 'backend', 'job', 'medium', '트랜잭션의 ACID를 설명해보세요.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, interviewer_character, interviewer_pressure_count, total_questions, status, started_at, created_at, updated_at)
                VALUES (50, 1, 'backend', 'iron', 1, 1, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_session_questions (id, session_id, question_id, question_order, followup_count, created_at)
                VALUES (5001, 50, 501, 1, 0, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_answers (
                  id, session_question_id, answer_text, input_type, interviewer_emotion,
                  score_accuracy, score_logic, score_depth, score_delivery, score_total,
                  followup_required, followup_reason, created_at
                ) VALUES (
                  9001, 5001, '답변 예시', 'text', 'pressure',
                  2.8, 2.7, 2.6, 2.9, 2.8,
                  true, 'weak_reasoning', CURRENT_TIMESTAMP
                )
                """);
    }

    @Test
    void testGetTimelineReturnsOrderedItemsWithEmotionAndScore() {
        InterviewSessionTimelineResponse response = interviewSessionTimelineService.getTimeline(50L, 1L);

        assertThat(response.getSessionId()).isEqualTo("50");
        assertThat(response.getInterviewerCharacter()).isEqualTo("iron");
        assertThat(response.getEndReason()).isNull();
        assertThat(response.getSummary()).isNotNull();
        assertThat(response.getSummary().getPressureCount()).isEqualTo(1);
        assertThat(response.getSummary().getAverageScore()).isEqualTo(2.8);
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getInterviewerEmotion()).isEqualTo("pressure");
        assertThat(response.getItems().get(0).getScoreTotal()).isEqualTo(2.8);
        assertThat(response.getItems().get(0).getFollowupReason()).isEqualTo("weak_reasoning");
    }

    @Test
    void testGetTimelineIncludesEndReason() {
        jdbcTemplate.update("UPDATE interview_sessions SET end_reason = 'completed_all_questions' WHERE id = 50");

        InterviewSessionTimelineResponse response = interviewSessionTimelineService.getTimeline(50L, 1L);

        assertThat(response.getEndReason()).isEqualTo("completed_all_questions");
    }
}
