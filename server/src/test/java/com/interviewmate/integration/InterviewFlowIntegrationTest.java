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

import java.util.List;

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
        JsonNode startResponseJson = startSession("backend", "Spring Boot", "jobseeker");
        String sessionId = startResponseJson.path("data").path("session_id").asText();
        String questionId = startResponseJson.path("data").path("first_question").path("question_id").asText();

        assertThat(sessionId).isNotBlank();
        assertThat(questionId).isNotBlank();

        String answerPayload = """
                {
                  "question_id": %s,
                  "answer_text": "ACID는 원자성, 일관성, 고립성, 지속성을 의미합니다. 트랜잭션은 장애 상황에서 롤백을 통해 정합성을 지키고, 커밋 이후에는 변경사항을 유지해 데이터 신뢰성을 보장합니다.",
                  "input_type": "text"
                }
                """.formatted(questionId);

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

        JsonNode answerResponseJson = objectMapper.readTree(answerResponseBody);

        assertThat(answerResponseJson.path("success").asBoolean()).isTrue();
        assertThat(answerResponseJson.path("data").path("session_id").asText()).isEqualTo(sessionId);
        assertThat(answerResponseJson.path("data").path("question_id").asText()).isEqualTo(questionId);
        assertThat(answerResponseJson.path("data").path("evaluation").path("total_score").asDouble()).isGreaterThan(0.0);
        assertThat(answerResponseJson.path("data").path("coaching_message").asText()).isNotBlank();
    }

    @Test
    @DisplayName("꼬리질문이 없으면 다음 문항으로 진행된다")
    void testNextQuestionProgressionFlow() throws Exception {
        JsonNode startResponseJson = startSession("backend", "Spring Boot", "jobseeker");
        String sessionId = startResponseJson.path("data").path("session_id").asText();
        String firstQuestionId = startResponseJson.path("data").path("first_question").path("question_id").asText();

        String firstAnswerPayload = """
                {
                  "question_id": %s,
                  "answer_text": "격리 수준은 Read Uncommitted, Read Committed, Repeatable Read, Serializable로 구분됩니다. 수준이 높을수록 정합성은 강해지지만 동시성 비용이 증가합니다. 실무에서는 트래픽과 정합성 요구를 기준으로 기본 수준을 정하고, 필요한 쿼리에만 락 전략을 추가합니다.",
                  "input_type": "text"
                }
                """.formatted(firstQuestionId);

        JsonNode firstAnswerJson = objectMapper.readTree(webTestClient.post()
                .uri("/api/interview/sessions/" + sessionId + "/answers")
                .header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(firstAnswerPayload)
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody());

        assertThat(firstAnswerJson.path("data").path("question_id").asText()).isEqualTo(firstQuestionId);
        assertThat(firstAnswerJson.path("data").path("evaluation").path("followup_required").asBoolean()).isFalse();
        assertThat(firstAnswerJson.path("data").path("next_question").isNull()).isFalse();

        String secondQuestionId = firstAnswerJson.path("data").path("next_question").path("question_id").asText();

        String secondAnswerPayload = """
                {
                  "question_id": %s,
                  "answer_text": "REST는 리소스 중심 URL과 HTTP 메서드를 사용해 캐시와 상태코드 표준화를 활용하기 좋습니다. RPC는 함수 호출 관점으로 내부 서비스 통신에 효율적입니다. 외부 API와 내부 API의 목적에 맞춰 혼합 전략을 적용할 수 있습니다.",
                  "input_type": "text"
                }
                """.formatted(secondQuestionId);

        JsonNode secondAnswerJson = objectMapper.readTree(webTestClient.post()
                .uri("/api/interview/sessions/" + sessionId + "/answers")
                .header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(secondAnswerPayload)
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody());

        assertThat(secondAnswerJson.path("data").path("question_id").asText()).isEqualTo(secondQuestionId);
        assertThat(secondAnswerJson.path("data").path("session_status").asText()).isEqualTo("in_progress");
        assertThat(secondAnswerJson.path("data").path("session_completed").asBoolean()).isFalse();
    }

    @Test
    @DisplayName("수동 세션 종료 후에는 답변 제출이 차단된다")
    void testManualEndBlocksFurtherAnswerSubmission() throws Exception {
        JsonNode startResponseJson = startSession("backend", "Spring Boot", "jobseeker");
        String sessionId = startResponseJson.path("data").path("session_id").asText();
        String questionId = startResponseJson.path("data").path("first_question").path("question_id").asText();

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
                  "question_id": %s,
                  "answer_text": "ACID는 원자성, 일관성, 고립성, 지속성입니다.",
                  "input_type": "text"
                }
                """.formatted(questionId);

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
    }

    @Test
    @DisplayName("세션 시작 시 생성된 질문은 job/cs 카테고리와 총 문항 수를 만족한다")
    void testSessionStartQuestionCompositionUsesGeneratedQuestionPlan() throws Exception {
        JsonNode startResponseJson = startSession("backend", "Spring Boot", "jobseeker");
        long sessionId = startResponseJson.path("data").path("session_id").asLong();

        Integer totalCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM interview_session_questions WHERE session_id = ?",
                Integer.class,
                sessionId
        );
        List<String> categories = jdbcTemplate.queryForList("""
                SELECT DISTINCT q.question_category
                FROM interview_session_questions sq
                JOIN interview_questions q ON q.id = sq.question_id
                WHERE sq.session_id = ?
                """, String.class, sessionId);

        assertThat(totalCount).isEqualTo(7);
        assertThat(categories).isNotEmpty();
        assertThat(categories).allMatch(category -> "job".equals(category) || "cs".equals(category));
    }

    @Test
    @DisplayName("진행 중 세션에서는 report/study 조회가 차단된다")
    void testReportAndStudyAreBlockedForInProgressSession() throws Exception {
        JsonNode startResponseJson = startSession("backend", "Spring Boot", "jobseeker");
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
        JsonNode startResponseJson = startSession("backend", "Spring Boot", "jobseeker");
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

    private JsonNode startSession(String role, String stack, String difficulty) throws Exception {
        String payload = """
                {
                  "job_role": "%s",
                  "stack": "%s",
                  "difficulty": "%s"
                }
                """.formatted(role, stack, difficulty);

        String responseBody = webTestClient.post()
                .uri("/api/interview/sessions/start")
                .header("X-API-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody();

        assertThat(responseBody).isNotBlank();
        JsonNode responseJson = objectMapper.readTree(responseBody);
        assertThat(responseJson.path("success").asBoolean()).isTrue();
        return responseJson;
    }
}
