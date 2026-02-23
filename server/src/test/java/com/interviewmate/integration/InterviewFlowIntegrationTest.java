package com.interviewmate.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient(timeout = "30000")
@ActiveProfiles("test")
@Testcontainers
class InterviewFlowIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private ObjectMapper objectMapper;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("app.rate-limit.enabled", () -> "false");
    }

    @Test
    @DisplayName("면접 세션 시작 후 답변 제출까지 전체 흐름 검증")
    void testInterviewSessionStartAndAnswerSubmitFlow() throws Exception {
        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (100, 'backend', 'job', 'medium', '트랜잭션의 ACID를 설명해보세요.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        String startResponseBody = webTestClient.post()
                .uri("/api/interview/sessions/start")
                .header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("{\"job_role\":\"backend\"}")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody();

        assertThat(startResponseBody).isNotBlank();
        JsonNode startResponseJson = objectMapper.readTree(startResponseBody);
        String sessionId = startResponseJson.path("data").path("session_id").asText();
        String questionId = startResponseJson.path("data").path("first_question").path("question_id").asText();

        assertThat(sessionId).isNotBlank();
        assertThat(questionId).isEqualTo("100");

        String answerPayload = """
                {
                  "question_id": 100,
                  "answer_text": "ACID는 원자성, 일관성, 고립성, 지속성을 의미합니다. 트랜잭션은 장애 상황에서 롤백을 통해 정합성을 지키고, 커밋 이후에는 변경사항을 유지해 데이터 신뢰성을 보장합니다.",
                  "input_type": "text"
                }
                """;

        String answerResponseBody = webTestClient.post()
                .uri("/api/interview/sessions/" + sessionId + "/answers")
                .header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(answerPayload)
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody();

        assertThat(answerResponseBody).isNotBlank();
        JsonNode answerResponseJson = objectMapper.readTree(answerResponseBody);

        assertThat(answerResponseJson.path("success").asBoolean()).isTrue();
        assertThat(answerResponseJson.path("data").path("session_id").asText()).isEqualTo(sessionId);
        assertThat(answerResponseJson.path("data").path("question_id").asText()).isEqualTo(questionId);
        assertThat(answerResponseJson.path("data").path("evaluation").path("total_score").asDouble()).isGreaterThan(3.0);
    }

    @Test
    @DisplayName("꼬리질문이 없으면 다음 문항을 반환하고 마지막 문항 제출 시 세션을 완료한다")
    void testNextQuestionAndSessionCompletionFlow() throws Exception {
        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (200, 'backend', 'job', 'medium', '트랜잭션 격리 수준을 설명해보세요.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (201, 'backend', 'cs', 'easy', 'REST와 RPC의 차이를 설명해보세요.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        String startResponseBody = webTestClient.post()
                .uri("/api/interview/sessions/start")
                .header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("{\"job_role\":\"backend\"}")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody();

        JsonNode startResponseJson = objectMapper.readTree(startResponseBody);
        String sessionId = startResponseJson.path("data").path("session_id").asText();
        String firstQuestionId = startResponseJson.path("data").path("first_question").path("question_id").asText();

        String firstAnswerPayload = """
                {
                  "question_id": 200,
                  "answer_text": "격리 수준은 Read Uncommitted, Read Committed, Repeatable Read, Serializable로 구분됩니다. 수준이 높을수록 정합성은 강해지지만 동시성 비용이 증가합니다. 실무에서는 트래픽과 정합성 요구를 기준으로 기본 수준을 정하고, 필요한 쿼리에만 락 전략을 추가합니다.",
                  "input_type": "text"
                }
                """;

        String firstAnswerResponse = webTestClient.post()
                .uri("/api/interview/sessions/" + sessionId + "/answers")
                .header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(firstAnswerPayload)
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody();

        JsonNode firstAnswerJson = objectMapper.readTree(firstAnswerResponse);
        assertThat(firstAnswerJson.path("data").path("question_id").asText()).isEqualTo(firstQuestionId);
        assertThat(firstAnswerJson.path("data").path("evaluation").path("followup_required").asBoolean()).isFalse();
        assertThat(firstAnswerJson.path("data").path("next_question").path("question_id").asText()).isEqualTo("201");
        assertThat(firstAnswerJson.path("data").path("session_status").asText()).isEqualTo("in_progress");
        assertThat(firstAnswerJson.path("data").path("session_completed").asBoolean()).isFalse();

        String secondAnswerPayload = """
                {
                  "question_id": 201,
                  "answer_text": "REST는 리소스 중심 URL과 HTTP 메서드를 사용해 캐시와 표준 상태코드를 활용하기 좋습니다. RPC는 함수 호출 인터페이스에 가깝고 내부 서비스 간 고성능 통신에 유리합니다. 외부 API는 REST, 내부 서비스는 RPC를 혼합해 목적에 맞게 설계할 수 있습니다.",
                  "input_type": "text"
                }
                """;

        String secondAnswerResponse = webTestClient.post()
                .uri("/api/interview/sessions/" + sessionId + "/answers")
                .header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(secondAnswerPayload)
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody();

        JsonNode secondAnswerJson = objectMapper.readTree(secondAnswerResponse);
        assertThat(secondAnswerJson.path("data").path("question_id").asText()).isEqualTo("201");
        assertThat(secondAnswerJson.path("data").path("next_question").isNull()).isTrue();
        assertThat(secondAnswerJson.path("data").path("session_status").asText()).isEqualTo("completed");
        assertThat(secondAnswerJson.path("data").path("end_reason").asText()).isEqualTo("completed_all_questions");
        assertThat(secondAnswerJson.path("data").path("session_completed").asBoolean()).isTrue();

        String reportResponseBody = webTestClient.get()
                .uri("/api/interview/sessions/" + sessionId + "/report")
                .header("X-API-Key", "test-key")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody();

        JsonNode reportJson = objectMapper.readTree(reportResponseBody);
        assertThat(reportJson.path("data").path("session_id").asText()).isEqualTo(sessionId);
        assertThat(reportJson.path("data").path("session_status").asText()).isEqualTo("completed");
        assertThat(reportJson.path("data").path("answered_questions").asInt()).isEqualTo(2);
    }

    @Test
    @DisplayName("수동 세션 종료 후에는 답변 제출이 차단된다")
    void testManualEndBlocksFurtherAnswerSubmission() throws Exception {
        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (300, 'backend', 'job', 'medium', '트랜잭션의 ACID를 설명해보세요.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        String startResponseBody = webTestClient.post()
                .uri("/api/interview/sessions/start")
                .header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("{\"job_role\":\"backend\"}")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody();

        JsonNode startResponseJson = objectMapper.readTree(startResponseBody);
        String sessionId = startResponseJson.path("data").path("session_id").asText();

        String endResponseBody = webTestClient.post()
                .uri("/api/interview/sessions/" + sessionId + "/end")
                .header("X-API-Key", "test-key")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody();

        JsonNode endResponseJson = objectMapper.readTree(endResponseBody);
        assertThat(endResponseJson.path("data").path("session_status").asText()).isEqualTo("completed");
        assertThat(endResponseJson.path("data").path("end_reason").asText()).isEqualTo("user_end");

        String answerPayload = """
                {
                  "question_id": 300,
                  "answer_text": "ACID는 원자성, 일관성, 고립성, 지속성입니다.",
                  "input_type": "text"
                }
                """;

        webTestClient.post()
                .uri("/api/interview/sessions/" + sessionId + "/answers")
                .header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(answerPayload)
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.success").isEqualTo(false)
                .jsonPath("$.error.code").isEqualTo("INVALID_INPUT");

        webTestClient.get()
                .uri("/api/interview/sessions/" + sessionId + "/report")
                .header("X-API-Key", "test-key")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.success").isEqualTo(true)
                .jsonPath("$.data.session_id").isEqualTo(sessionId)
                .jsonPath("$.data.end_reason").isEqualTo("user_end");
    }

    @Test
    @DisplayName("세션 시작 시 질문 분배는 직무 5 + CS 2를 우선 보장한다")
    void testSessionStartQuestionCompositionIsFiveJobTwoCs() throws Exception {
        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (400, 'backend', 'cs', 'easy', 'CS 질문 1', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (401, 'backend', 'cs', 'medium', 'CS 질문 2', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (402, 'backend', 'cs', 'hard', 'CS 질문 3', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (403, 'backend', 'job', 'easy', '직무 질문 1', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (404, 'backend', 'job', 'medium', '직무 질문 2', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (405, 'backend', 'job', 'medium', '직무 질문 3', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (406, 'backend', 'job', 'hard', '직무 질문 4', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (407, 'backend', 'job', 'hard', '직무 질문 5', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (408, 'backend', 'job', 'easy', '직무 질문 6', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        String startResponseBody = webTestClient.post()
                .uri("/api/interview/sessions/start")
                .header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("{\"job_role\":\"backend\"}")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody();

        JsonNode startResponseJson = objectMapper.readTree(startResponseBody);
        long sessionId = startResponseJson.path("data").path("session_id").asLong();
        String firstQuestionCategory = startResponseJson.path("data").path("first_question").path("category").asText();

        Integer jobCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM interview_session_questions sq
                JOIN interview_questions q ON q.id = sq.question_id
                WHERE sq.session_id = ? AND q.question_category = 'job'
                """, Integer.class, sessionId);
        Integer csCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM interview_session_questions sq
                JOIN interview_questions q ON q.id = sq.question_id
                WHERE sq.session_id = ? AND q.question_category = 'cs'
                """, Integer.class, sessionId);

        assertThat(jobCount).isEqualTo(5);
        assertThat(csCount).isEqualTo(2);
        assertThat(firstQuestionCategory).isEqualTo("job");
    }

    @Test
    @DisplayName("진행 중 세션에서는 report/study 조회가 차단된다")
    void testReportAndStudyAreBlockedForInProgressSession() throws Exception {
        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (500, 'backend', 'job', 'medium', '트랜잭션의 ACID를 설명해보세요.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        String startResponseBody = webTestClient.post()
                .uri("/api/interview/sessions/start")
                .header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("{\"job_role\":\"backend\"}")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody();

        JsonNode startResponseJson = objectMapper.readTree(startResponseBody);
        String sessionId = startResponseJson.path("data").path("session_id").asText();

        webTestClient.get()
                .uri("/api/interview/sessions/" + sessionId + "/report")
                .header("X-API-Key", "test-key")
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.success").isEqualTo(false)
                .jsonPath("$.error.code").isEqualTo("INVALID_INPUT");

        webTestClient.get()
                .uri("/api/interview/sessions/" + sessionId + "/study")
                .header("X-API-Key", "test-key")
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.success").isEqualTo(false)
                .jsonPath("$.error.code").isEqualTo("INVALID_INPUT");
    }

    @Test
    @DisplayName("답변 길이 경계값: 2000자는 허용되고 2001자는 차단된다")
    void testAnswerLengthBoundaryInIntegrationFlow() throws Exception {
        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (700, 'backend', 'job', 'medium', '트랜잭션의 ACID를 설명해보세요.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        String startResponseBody = webTestClient.post()
                .uri("/api/interview/sessions/start")
                .header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("{\"job_role\":\"backend\"}")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody();

        JsonNode startResponseJson = objectMapper.readTree(startResponseBody);
        String sessionId = startResponseJson.path("data").path("session_id").asText();
        String questionId = startResponseJson.path("data").path("first_question").path("question_id").asText();

        String maxAllowedAnswer = "a".repeat(2000);
        String allowedPayload = """
                {
                  "question_id": %s,
                  "answer_text": "%s",
                  "input_type": "text"
                }
                """.formatted(questionId, maxAllowedAnswer);

        webTestClient.post()
                .uri("/api/interview/sessions/" + sessionId + "/answers")
                .header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(allowedPayload)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.success").isEqualTo(true);

        String tooLongAnswer = "b".repeat(2001);
        String blockedPayload = """
                {
                  "question_id": %s,
                  "answer_text": "%s",
                  "input_type": "text"
                }
                """.formatted(questionId, tooLongAnswer);

        webTestClient.post()
                .uri("/api/interview/sessions/" + sessionId + "/answers")
                .header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(blockedPayload)
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.success").isEqualTo(false)
                .jsonPath("$.error.code").isEqualTo("INVALID_INPUT");
    }
}
