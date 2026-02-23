package com.interviewmate.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient(timeout = "30000")
@ActiveProfiles("test")
@Testcontainers
class InterviewHistoryIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private WebTestClient webTestClient;

    private void seedOneAnsweredQuestion() {
        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (600, 'backend', 'cs', 'easy', 'REST와 RPC 차이를 설명해보세요.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, interviewer_character, total_questions, status, end_reason, started_at, created_at, updated_at)
                VALUES (60, 1, 'backend', 'jet', 1, 'completed', 'completed_all_questions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_session_questions (id, session_id, question_id, question_order, followup_count, created_at)
                VALUES (6001, 60, 600, 1, 0, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_answers (id, session_question_id, answer_text, input_type, interviewer_emotion, created_at)
                VALUES (9001, 6001, 'REST는 리소스 중심, RPC는 함수 호출 중심입니다.', 'text', 'neutral', CURRENT_TIMESTAMP)
                """);
    }

    @Test
    @DisplayName("히스토리 조회에서 days 미지정 시 기본값 30일을 사용한다")
    void testHistoryUsesDefaultDaysWhenMissing() {
        seedOneAnsweredQuestion();

        webTestClient.get()
                .uri("/api/interview/history")
                .header("X-API-Key", "test-key")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.success").isEqualTo(true)
                .jsonPath("$.data.requested_days").isEqualTo(30)
                .jsonPath("$.data.total_count").isEqualTo(1)
                .jsonPath("$.data.items[0].session_end_reason").isEqualTo("completed_all_questions");
    }

    @Test
    @DisplayName("히스토리 조회에서 days=90은 허용된다")
    void testHistoryAcceptsDays90() {
        seedOneAnsweredQuestion();

        webTestClient.get()
                .uri("/api/interview/history?days=90")
                .header("X-API-Key", "test-key")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.success").isEqualTo(true)
                .jsonPath("$.data.requested_days").isEqualTo(90);
    }

    @Test
    @DisplayName("히스토리 조회에서 days=91은 차단된다")
    void testHistoryRejectsDays91() {
        webTestClient.get()
                .uri("/api/interview/history?days=91")
                .header("X-API-Key", "test-key")
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.success").isEqualTo(false)
                .jsonPath("$.error.code").isEqualTo("INVALID_INPUT");
    }
}
