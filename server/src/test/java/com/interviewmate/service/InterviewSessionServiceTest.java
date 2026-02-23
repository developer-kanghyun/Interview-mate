package com.interviewmate.service;

import com.interviewmate.dto.request.InterviewSessionStartRequest;
import com.interviewmate.dto.response.InterviewSessionStartResponse;
import com.interviewmate.repository.InterviewQuestionRepository;
import com.interviewmate.repository.InterviewSessionRepository;
import com.interviewmate.repository.InterviewSessionQuestionRepository;
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
class InterviewSessionServiceTest {

    @Autowired
    private InterviewSessionService interviewSessionService;

    @Autowired
    private InterviewSessionRepository interviewSessionRepository;

    @Autowired
    private InterviewSessionQuestionRepository interviewSessionQuestionRepository;

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
        interviewSessionQuestionRepository.deleteAll();
        interviewSessionRepository.deleteAll();
        interviewQuestionRepository.deleteAll();
        userRepository.deleteAll();
        jdbcTemplate.update("INSERT INTO users (id, api_key, created_at, updated_at) VALUES (1, 'test-key', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (100, 'backend', 'job', 'medium', '트랜잭션의 ACID를 설명해보세요.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
    }

    @Test
    void testStartSessionSavesInterviewSession() {
        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");

        InterviewSessionStartResponse response = interviewSessionService.startSession(request, 1L);

        assertThat(response.getSessionId()).isNotBlank();
        assertThat(response.getJobRole()).isEqualTo("backend");
        assertThat(response.getInterviewerCharacter()).isEqualTo("jet");
        assertThat(response.getTotalQuestions()).isEqualTo(1);
        assertThat(response.getStatus()).isEqualTo("in_progress");
        assertThat(response.getFirstQuestion().getQuestionId()).isEqualTo("100");
        assertThat(response.getFirstQuestion().getContent()).contains("ACID");
        assertThat(interviewSessionRepository.count()).isEqualTo(1);
        assertThat(interviewSessionQuestionRepository.count()).isEqualTo(1);
    }

    @Test
    void testStartSessionUsesRequestedInterviewerCharacter() {
        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");
        request.setInterviewerCharacter("iron");

        InterviewSessionStartResponse response = interviewSessionService.startSession(request, 1L);

        assertThat(response.getInterviewerCharacter()).isEqualTo("iron");
    }

    @Test
    void testStartSessionSelectsQuestionsAsJobFiveAndCsTwo() {
        interviewSessionQuestionRepository.deleteAll();
        interviewSessionRepository.deleteAll();
        interviewQuestionRepository.deleteAll();

        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (101, 'backend', 'cs', 'easy', 'CS 질문 1', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (102, 'backend', 'cs', 'easy', 'CS 질문 2', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (103, 'backend', 'cs', 'medium', 'CS 질문 3', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (104, 'backend', 'job', 'easy', '직무 질문 1', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (105, 'backend', 'job', 'medium', '직무 질문 2', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (106, 'backend', 'job', 'medium', '직무 질문 3', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (107, 'backend', 'job', 'hard', '직무 질문 4', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (108, 'backend', 'job', 'hard', '직무 질문 5', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (109, 'backend', 'job', 'easy', '직무 질문 6', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");

        InterviewSessionStartResponse response = interviewSessionService.startSession(request, 1L);

        Long sessionId = Long.valueOf(response.getSessionId());
        Integer selectedJobCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM interview_session_questions sq
                JOIN interview_questions q ON q.id = sq.question_id
                WHERE sq.session_id = ? AND q.question_category = 'job'
                """, Integer.class, sessionId);
        Integer selectedCsCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM interview_session_questions sq
                JOIN interview_questions q ON q.id = sq.question_id
                WHERE sq.session_id = ? AND q.question_category = 'cs'
                """, Integer.class, sessionId);

        assertThat(response.getTotalQuestions()).isEqualTo(7);
        assertThat(selectedJobCount).isEqualTo(5);
        assertThat(selectedCsCount).isEqualTo(2);
    }

    @Test
    void testStartSessionFillsRemainingWhenJobQuestionsAreInsufficient() {
        interviewSessionQuestionRepository.deleteAll();
        interviewSessionRepository.deleteAll();
        interviewQuestionRepository.deleteAll();

        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (201, 'backend', 'job', 'easy', '직무 질문 1', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (202, 'backend', 'job', 'medium', '직무 질문 2', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (203, 'backend', 'job', 'hard', '직무 질문 3', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (204, 'backend', 'cs', 'easy', 'CS 질문 1', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (205, 'backend', 'cs', 'easy', 'CS 질문 2', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (206, 'backend', 'cs', 'medium', 'CS 질문 3', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (207, 'backend', 'cs', 'medium', 'CS 질문 4', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (208, 'backend', 'cs', 'hard', 'CS 질문 5', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");

        InterviewSessionStartResponse response = interviewSessionService.startSession(request, 1L);

        Long sessionId = Long.valueOf(response.getSessionId());
        Integer selectedJobCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM interview_session_questions sq
                JOIN interview_questions q ON q.id = sq.question_id
                WHERE sq.session_id = ? AND q.question_category = 'job'
                """, Integer.class, sessionId);
        Integer selectedCsCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM interview_session_questions sq
                JOIN interview_questions q ON q.id = sq.question_id
                WHERE sq.session_id = ? AND q.question_category = 'cs'
                """, Integer.class, sessionId);

        assertThat(response.getTotalQuestions()).isEqualTo(7);
        assertThat(selectedJobCount).isEqualTo(3);
        assertThat(selectedCsCount).isEqualTo(4);
    }

    @Test
    void testStartSessionFillsRemainingWhenCsQuestionsAreInsufficient() {
        interviewSessionQuestionRepository.deleteAll();
        interviewSessionRepository.deleteAll();
        interviewQuestionRepository.deleteAll();

        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (301, 'backend', 'job', 'easy', '직무 질문 1', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (302, 'backend', 'job', 'medium', '직무 질문 2', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (303, 'backend', 'job', 'hard', '직무 질문 3', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (304, 'backend', 'job', 'easy', '직무 질문 4', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (305, 'backend', 'job', 'medium', '직무 질문 5', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (306, 'backend', 'job', 'hard', '직무 질문 6', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (307, 'backend', 'cs', 'easy', 'CS 질문 1', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (308, 'backend', 'job', 'easy', '직무 질문 7', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");

        InterviewSessionStartResponse response = interviewSessionService.startSession(request, 1L);

        Long sessionId = Long.valueOf(response.getSessionId());
        Integer selectedJobCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM interview_session_questions sq
                JOIN interview_questions q ON q.id = sq.question_id
                WHERE sq.session_id = ? AND q.question_category = 'job'
                """, Integer.class, sessionId);
        Integer selectedCsCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM interview_session_questions sq
                JOIN interview_questions q ON q.id = sq.question_id
                WHERE sq.session_id = ? AND q.question_category = 'cs'
                """, Integer.class, sessionId);

        assertThat(response.getTotalQuestions()).isEqualTo(7);
        assertThat(selectedJobCount).isEqualTo(6);
        assertThat(selectedCsCount).isEqualTo(1);
    }

    @Test
    void testStartSessionTreatsQuestionCategoryCaseInsensitively() {
        interviewSessionQuestionRepository.deleteAll();
        interviewSessionRepository.deleteAll();
        interviewQuestionRepository.deleteAll();

        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (401, 'backend', 'JOB', 'easy', '직무 질문 1', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (402, 'backend', 'Job', 'medium', '직무 질문 2', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (403, 'backend', 'job', 'hard', '직무 질문 3', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (404, 'backend', 'JOB', 'easy', '직무 질문 4', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (405, 'backend', 'job', 'medium', '직무 질문 5', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (406, 'backend', 'CS', 'easy', 'CS 질문 1', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (407, 'backend', 'Cs', 'medium', 'CS 질문 2', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (408, 'backend', 'cs', 'hard', 'CS 질문 3', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");

        InterviewSessionStartResponse response = interviewSessionService.startSession(request, 1L);

        Long sessionId = Long.valueOf(response.getSessionId());
        Integer selectedJobCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM interview_session_questions sq
                JOIN interview_questions q ON q.id = sq.question_id
                WHERE sq.session_id = ? AND LOWER(q.question_category) = 'job'
                """, Integer.class, sessionId);
        Integer selectedCsCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM interview_session_questions sq
                JOIN interview_questions q ON q.id = sq.question_id
                WHERE sq.session_id = ? AND LOWER(q.question_category) = 'cs'
                """, Integer.class, sessionId);

        assertThat(response.getTotalQuestions()).isEqualTo(7);
        assertThat(selectedJobCount).isEqualTo(5);
        assertThat(selectedCsCount).isEqualTo(2);
    }

    @Test
    void testStartSessionLimitsGuestPreviewToOneQuestion() {
        interviewSessionQuestionRepository.deleteAll();
        interviewSessionRepository.deleteAll();
        interviewQuestionRepository.deleteAll();

        jdbcTemplate.update(
                "INSERT INTO users (id, api_key, is_guest, created_at, updated_at) VALUES (2, 'guest-key', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        );
        jdbcTemplate.update("""
                INSERT INTO interview_questions (id, job_role, question_category, difficulty, content, is_active, created_at, updated_at)
                VALUES (501, 'backend', 'job', 'easy', '직무 질문 1', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (502, 'backend', 'job', 'medium', '직무 질문 2', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (503, 'backend', 'job', 'hard', '직무 질문 3', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (504, 'backend', 'cs', 'easy', 'CS 질문 1', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (505, 'backend', 'cs', 'easy', 'CS 질문 2', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (506, 'backend', 'job', 'easy', '직무 질문 4', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                       (507, 'backend', 'job', 'medium', '직무 질문 5', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);

        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");

        InterviewSessionStartResponse response = interviewSessionService.startSession(request, 2L);

        Long sessionId = Long.valueOf(response.getSessionId());
        Integer selectedCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM interview_session_questions
                WHERE session_id = ?
                """, Integer.class, sessionId);

        assertThat(response.getTotalQuestions()).isEqualTo(1);
        assertThat(selectedCount).isEqualTo(1);
    }
}
