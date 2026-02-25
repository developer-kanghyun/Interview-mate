package com.interviewmate.service;

import com.interviewmate.dto.request.InterviewAnswerSubmitRequest;
import com.interviewmate.dto.response.InterviewAnswerSubmitResponse;
import com.interviewmate.global.error.AppException;
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
class InterviewAnswerServiceTest {

    @Autowired
    private InterviewAnswerService interviewAnswerService;

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
                VALUES (100, 'backend', 'job', 'medium', '트랜잭션의 ACID를 설명해보세요.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (101, 'backend', 'cs', 'easy', 'REST와 RPC의 차이를 설명해보세요.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, interviewer_character, total_questions, status, started_at, created_at, updated_at)
                VALUES (10, 1, 'backend', 'jet', 2, 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_session_questions (id, session_id, question_id, question_order, followup_count, created_at)
                VALUES (1000, 10, 100, 1, 0, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_session_questions (id, session_id, question_id, question_order, followup_count, created_at)
                VALUES (1001, 10, 101, 2, 0, CURRENT_TIMESTAMP)
                """);
    }

    @Test
    void testSubmitAnswerSavesAnswer() {
        InterviewAnswerSubmitRequest request = new InterviewAnswerSubmitRequest();
        request.setQuestionId(100L);
        request.setAnswerText("ACID는 원자성, 일관성, 고립성, 지속성으로 구성되며 트랜잭션 실패 시 롤백과 커밋 전략을 통해 데이터 정합성을 보장합니다. 또한 격리 수준 선택은 동시성 이슈와 성능의 균형을 고려해 결정합니다.");
        request.setInputType("text");

        InterviewAnswerSubmitResponse response = interviewAnswerService.submitAnswer(10L, request);

        assertThat(response.getAnswerId()).isNotBlank();
        assertThat(response.getSessionId()).isEqualTo("10");
        assertThat(response.getQuestionId()).isEqualTo("100");
        assertThat(response.getInputType()).isEqualTo("text");
        assertThat(response.getInterviewerCharacter()).isEqualTo("jet");
        assertThat(response.getEvaluation()).isNotNull();
        assertThat(response.getEvaluation().isFollowupRequired()).isFalse();
        assertThat(response.getEvaluation().getFollowupRemaining()).isEqualTo(2);
        assertThat(response.getInterviewerEmotion()).isNotBlank();
        assertThat(response.getCoachingMessage()).isNotBlank();
        assertThat(response.getFollowupQuestion()).isNull();
        assertThat(interviewAnswerRepository.count()).isEqualTo(1);
        var storedAnswer = interviewAnswerRepository.findById(Long.valueOf(response.getAnswerId())).orElseThrow();
        assertThat(storedAnswer.getScoreTotal()).isNotNull();
        assertThat(storedAnswer.getScoreAccuracy()).isNotNull();
        assertThat(storedAnswer.getFollowupReason()).isNotBlank();
        assertThat(storedAnswer.getCoachingMessage()).isNotBlank();
    }

    @Test
    void testSubmitAnswerReturnsNextQuestionWhenFollowupNotRequired() {
        InterviewAnswerSubmitRequest request = new InterviewAnswerSubmitRequest();
        request.setQuestionId(100L);
        request.setAnswerText("ACID는 원자성, 일관성, 고립성, 지속성 네 가지 속성으로 트랜잭션 안정성을 보장합니다. 원자성은 전부 성공 또는 전부 실패를 강제하고, 일관성은 제약조건 위반을 방지하며, 고립성은 동시성 충돌을 제어하고, 지속성은 커밋 이후 장애에도 결과를 보존합니다.");
        request.setInputType("text");

        InterviewAnswerSubmitResponse response = interviewAnswerService.submitAnswer(10L, request);

        assertThat(response.getEvaluation().isFollowupRequired()).isFalse();
        assertThat(response.getEvaluation().getFollowupRemaining()).isEqualTo(2);
        assertThat(response.getInterviewerEmotion()).isIn("encourage", "neutral");
        assertThat(response.getNextQuestion()).isNotNull();
        assertThat(response.getNextQuestion().getQuestionId()).isEqualTo("101");
        assertThat(response.getNextQuestion().getQuestionOrder()).isEqualTo(2);
        assertThat(response.getSessionStatus()).isEqualTo("in_progress");
        assertThat(response.getEndReason()).isNull();
        assertThat(response.isSessionCompleted()).isFalse();
    }

    @Test
    void testSubmitAnswerStopsFollowupWhenLimitReached() {
        jdbcTemplate.update("UPDATE interview_session_questions SET followup_count = 2 WHERE id = 1000");

        InterviewAnswerSubmitRequest request = new InterviewAnswerSubmitRequest();
        request.setQuestionId(100L);
        request.setAnswerText("잘 모르겠습니다.");
        request.setInputType("text");

        InterviewAnswerSubmitResponse response = interviewAnswerService.submitAnswer(10L, request);

        assertThat(response.getEvaluation()).isNotNull();
        assertThat(response.getEvaluation().isFollowupRequired()).isFalse();
        assertThat(response.getEvaluation().getFollowupReason()).isEqualTo("followup_limit_reached");
        assertThat(response.getEvaluation().getFollowupRemaining()).isEqualTo(0);
        assertThat(response.getInterviewerEmotion()).isEqualTo("pressure");
        assertThat(response.getFollowupQuestion()).isNull();
        assertThat(response.getNextQuestion()).isNotNull();
        assertThat(response.getNextQuestion().getQuestionId()).isEqualTo("101");
        assertThat(response.getSessionStatus()).isEqualTo("in_progress");
        assertThat(response.isSessionCompleted()).isFalse();
    }

    @Test
    void testSubmitAnswerReturnsNeutralWhenPressureLimitReached() {
        jdbcTemplate.update("UPDATE interview_sessions SET interviewer_pressure_count = 2 WHERE id = 10");

        InterviewAnswerSubmitRequest request = new InterviewAnswerSubmitRequest();
        request.setQuestionId(100L);
        request.setAnswerText("잘 모르겠습니다.");
        request.setInputType("text");

        InterviewAnswerSubmitResponse response = interviewAnswerService.submitAnswer(10L, request);

        assertThat(response.getInterviewerEmotion()).isEqualTo("neutral");
    }

    @Test
    void testSubmitAnswerDecreasesFollowupRemainingWhenFollowupIsGenerated() {
        InterviewAnswerSubmitRequest request = new InterviewAnswerSubmitRequest();
        request.setQuestionId(100L);
        request.setAnswerText("잘 모르겠습니다.");
        request.setInputType("text");

        InterviewAnswerSubmitResponse response = interviewAnswerService.submitAnswer(10L, request);

        assertThat(response.getEvaluation().isFollowupRequired()).isTrue();
        assertThat(response.getFollowupQuestion()).isNotBlank();
        assertThat(response.getEvaluation().getFollowupRemaining()).isEqualTo(1);
        assertThat(response.getCoachingMessage()).contains("다음 답변");

        Integer savedFollowupCount = jdbcTemplate.queryForObject(
                "SELECT followup_count FROM interview_session_questions WHERE id = 1000",
                Integer.class
        );
        assertThat(savedFollowupCount).isEqualTo(1);
    }

    @Test
    void testSubmitAnswerAllowsGuestFollowupBeforeCompletion() {
        jdbcTemplate.update(
                "INSERT INTO users (id, api_key, is_guest, created_at, updated_at) VALUES (2, 'guest-key', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        );
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, interviewer_character, total_questions, status, started_at, created_at, updated_at)
                VALUES (20, 2, 'backend', 'jet', 1, 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_session_questions (id, session_id, question_id, question_order, followup_count, created_at)
                VALUES (2000, 20, 100, 1, 0, CURRENT_TIMESTAMP)
                """);

        InterviewAnswerSubmitRequest request = new InterviewAnswerSubmitRequest();
        request.setQuestionId(100L);
        request.setAnswerText("잘 모르겠습니다.");
        request.setInputType("text");

        InterviewAnswerSubmitResponse response = interviewAnswerService.submitAnswer(20L, request);

        assertThat(response.getEvaluation()).isNotNull();
        assertThat(response.getEvaluation().isFollowupRequired()).isTrue();
        assertThat(response.getEvaluation().getFollowupReason()).isNotEqualTo("none");
        assertThat(response.getEvaluation().getFollowupRemaining()).isEqualTo(1);
        assertThat(response.getFollowupQuestion()).isNotBlank();
        assertThat(response.getNextQuestion()).isNull();
        assertThat(response.getSessionStatus()).isEqualTo("in_progress");
        assertThat(response.isSessionCompleted()).isFalse();
        Integer savedFollowupCount = jdbcTemplate.queryForObject(
                "SELECT followup_count FROM interview_session_questions WHERE id = 2000",
                Integer.class
        );
        assertThat(savedFollowupCount).isEqualTo(1);
    }

    @Test
    void testSubmitAnswerCompletesGuestSessionWhenFollowupLimitReached() {
        jdbcTemplate.update(
                "INSERT INTO users (id, api_key, is_guest, created_at, updated_at) VALUES (3, 'guest-key-2', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        );
        jdbcTemplate.update("""
                INSERT INTO interview_sessions (id, user_id, job_role, interviewer_character, total_questions, status, started_at, created_at, updated_at)
                VALUES (30, 3, 'backend', 'jet', 1, 'in_progress', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
        jdbcTemplate.update("""
                INSERT INTO interview_session_questions (id, session_id, question_id, question_order, followup_count, created_at)
                VALUES (3000, 30, 100, 1, 0, CURRENT_TIMESTAMP)
                """);

        InterviewAnswerSubmitRequest request = new InterviewAnswerSubmitRequest();
        request.setQuestionId(100L);
        request.setAnswerText("잘 모르겠습니다.");
        request.setInputType("text");

        InterviewAnswerSubmitResponse first = interviewAnswerService.submitAnswer(30L, request);
        InterviewAnswerSubmitResponse second = interviewAnswerService.submitAnswer(30L, request);
        InterviewAnswerSubmitResponse third = interviewAnswerService.submitAnswer(30L, request);

        assertThat(first.getEvaluation().isFollowupRequired()).isTrue();
        assertThat(first.getEvaluation().getFollowupRemaining()).isEqualTo(1);
        assertThat(first.isSessionCompleted()).isFalse();

        assertThat(second.getEvaluation().isFollowupRequired()).isTrue();
        assertThat(second.getEvaluation().getFollowupRemaining()).isEqualTo(0);
        assertThat(second.isSessionCompleted()).isFalse();

        assertThat(third.getEvaluation().isFollowupRequired()).isFalse();
        assertThat(third.getEvaluation().getFollowupReason()).isEqualTo("followup_limit_reached");
        assertThat(third.getFollowupQuestion()).isNull();
        assertThat(third.getSessionStatus()).isEqualTo("completed");
        assertThat(third.isSessionCompleted()).isTrue();
    }

    @Test
    void testSubmitAnswerMarksSessionCompletedOnLastQuestion() {
        InterviewAnswerSubmitRequest firstRequest = new InterviewAnswerSubmitRequest();
        firstRequest.setQuestionId(100L);
        firstRequest.setAnswerText("ACID는 원자성, 일관성, 고립성, 지속성으로 트랜잭션의 정합성과 복구 가능성을 보장합니다. 서비스에서는 격리 수준을 쿼리 특성에 맞춰 조정해 데드락 위험과 처리량을 균형 있게 관리합니다.");
        firstRequest.setInputType("text");
        interviewAnswerService.submitAnswer(10L, firstRequest);

        InterviewAnswerSubmitRequest secondRequest = new InterviewAnswerSubmitRequest();
        secondRequest.setQuestionId(101L);
        secondRequest.setAnswerText("REST는 리소스와 HTTP 메서드 중심의 표준화된 인터페이스를 활용해 캐시, 멱등성, 상태코드 등 웹 생태계 이점을 활용합니다. 반면 RPC는 함수 호출 관점에서 계약을 설계해 내부 서비스 간 고성능 통신에 유리하지만, 외부 공개 API에서는 버전 관리와 호환성 전략을 명확히 가져가야 합니다.");
        secondRequest.setInputType("text");

        InterviewAnswerSubmitResponse secondResponse = interviewAnswerService.submitAnswer(10L, secondRequest);

        assertThat(secondResponse.getEvaluation().isFollowupRequired()).isFalse();
        assertThat(secondResponse.getNextQuestion()).isNull();
        assertThat(secondResponse.getSessionStatus()).isEqualTo("completed");
        assertThat(secondResponse.getEndReason()).isEqualTo("completed_all_questions");
        assertThat(secondResponse.isSessionCompleted()).isTrue();
        String savedEndReason = jdbcTemplate.queryForObject(
                "SELECT end_reason FROM interview_sessions WHERE id = 10",
                String.class
        );
        assertThat(savedEndReason).isEqualTo("completed_all_questions");
    }

    @Test
    void testSubmitAnswerRejectsOutOfOrderQuestion() {
        InterviewAnswerSubmitRequest request = new InterviewAnswerSubmitRequest();
        request.setQuestionId(101L);
        request.setAnswerText("먼저 두 번째 문항에 답해보겠습니다.");
        request.setInputType("text");

        assertThatThrownBy(() -> interviewAnswerService.submitAnswer(10L, request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("현재 답변 가능한 질문이 아닙니다.");
    }

    @Test
    void testSubmitAnswerRejectsCompletedSession() {
        jdbcTemplate.update("UPDATE interview_sessions SET status = 'completed' WHERE id = 10");

        InterviewAnswerSubmitRequest request = new InterviewAnswerSubmitRequest();
        request.setQuestionId(100L);
        request.setAnswerText("이미 끝난 세션에 답변을 다시 제출합니다.");
        request.setInputType("text");

        assertThatThrownBy(() -> interviewAnswerService.submitAnswer(10L, request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("이미 종료된 세션입니다.");
    }
}
