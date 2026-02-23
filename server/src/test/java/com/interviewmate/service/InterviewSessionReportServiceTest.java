package com.interviewmate.service;

import com.interviewmate.dto.response.InterviewSessionReportResponse;
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
class InterviewSessionReportServiceTest {

    @Autowired
    private InterviewSessionReportService interviewSessionReportService;

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
                VALUES (300, 'backend', 'job', 'medium', '트랜잭션 격리 수준을 설명해보세요.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (301, 'backend', 'cs', 'easy', 'REST와 RPC의 차이를 설명해보세요.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, interviewer_character, total_questions, status, started_at, created_at, updated_at)
                VALUES (20, 1, 'backend', 'jet', 2, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_session_questions (id, session_id, question_id, question_order, followup_count, created_at)
                VALUES (2000, 20, 300, 1, 0, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_session_questions (id, session_id, question_id, question_order, followup_count, created_at)
                VALUES (2001, 20, 301, 2, 0, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_answers (id, session_question_id, answer_text, input_type, interviewer_emotion, coaching_message, created_at)
                VALUES (5000, 2000, '잘 모르겠습니다.', 'text', 'pressure', '핵심 개념 정의를 먼저 말해보세요.', CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_answers (id, session_question_id, answer_text, input_type, interviewer_emotion, coaching_message, created_at)
                VALUES (5001, 2001, 'REST는 리소스 중심 설계이고 RPC는 함수 호출 중심 설계입니다. REST는 HTTP 표준 생태계를 활용하기 쉽고 RPC는 내부 서비스 간 고성능 통신에 유리합니다.', 'text', 'encourage', '실무 트레이드오프까지 덧붙이면 더 좋습니다.', CURRENT_TIMESTAMP)
                """);
    }

    @Test
    void testGetSessionReportReturnsSummaryAndWeakKeywords() {
        InterviewSessionReportResponse response = interviewSessionReportService.getSessionReport(20L, 1L);

        assertThat(response.getSessionId()).isEqualTo("20");
        assertThat(response.getSessionStatus()).isEqualTo("completed");
        assertThat(response.getEndReason()).isNull();
        assertThat(response.getAnsweredQuestions()).isEqualTo(2);
        assertThat(response.getQuestions()).hasSize(2);
        assertThat(response.getQuestions().get(0).getModelAnswer()).isNotBlank();
        assertThat(response.getQuestions().get(0).getCoachingMessage()).isNotBlank();
        assertThat(response.getQuestions().get(0).getInterviewerEmotion()).isEqualTo("pressure");
        assertThat(response.getQuestions().get(0).getWeakConceptKeywords()).isNotEmpty();
        assertThat(response.getScoreSummary()).isNotNull();
        assertThat(response.getWeakKeywords()).isNotEmpty();
        assertThat(response.getWeakKeywords()).contains("정확성");
        assertThat(response.getPerformanceLevel()).isNotBlank();
        assertThat(response.getPriorityFocuses()).hasSize(2);
    }

    @Test
    void testGetSessionReportThrowsWhenSessionNotCompleted() {
        jdbcTemplate.update("UPDATE interview_sessions SET status = 'in_progress' WHERE id = 20");

        assertThatThrownBy(() -> interviewSessionReportService.getSessionReport(20L, 1L))
                .isInstanceOf(AppException.class);
    }

    @Test
    void testGetSessionReportIncludesEndReason() {
        jdbcTemplate.update("UPDATE interview_sessions SET end_reason = 'user_end' WHERE id = 20");

        InterviewSessionReportResponse response = interviewSessionReportService.getSessionReport(20L, 1L);

        assertThat(response.getEndReason()).isEqualTo("user_end");
    }

    @Test
    void testGetSessionReportThrowsWhenGuestUserRequestsReport() {
        jdbcTemplate.update(
                "INSERT INTO users (id, api_key, is_guest, created_at, updated_at) VALUES (2, 'guest-key', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        );
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, interviewer_character, total_questions, status, started_at, created_at, updated_at)
                VALUES (21, 2, 'backend', 'jet', 3, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_session_questions (id, session_id, question_id, question_order, followup_count, created_at)
                VALUES (2100, 21, 300, 1, 0, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_answers (id, session_question_id, answer_text, input_type, interviewer_emotion, coaching_message, created_at)
                VALUES (5100, 2100, '게스트 답변', 'text', 'neutral', '요약', CURRENT_TIMESTAMP)
                """);

        assertThatThrownBy(() -> interviewSessionReportService.getSessionReport(21L, 2L))
                .isInstanceOf(AppException.class)
                .extracting(error -> ((AppException) error).getErrorCode())
                .isEqualTo(ErrorCode.UNAUTHORIZED);
    }
}
