package com.interviewmate.controller;

import com.interviewmate.dto.request.InterviewSessionStartRequest;
import com.interviewmate.dto.response.InterviewSessionReportResponse;
import com.interviewmate.dto.response.InterviewSessionStartResponse;
import com.interviewmate.dto.response.InterviewSessionStateResponse;
import com.interviewmate.dto.response.InterviewSessionStudyResponse;
import com.interviewmate.dto.response.InterviewSessionTimelineResponse;
import com.interviewmate.dto.response.InterviewSessionEndResponse;
import com.interviewmate.dto.response.LatestActiveSessionResponse;
import com.interviewmate.repository.UserRepository;
import com.interviewmate.service.InterviewSessionReportService;
import com.interviewmate.service.InterviewSessionService;
import com.interviewmate.service.InterviewSessionStateService;
import com.interviewmate.service.InterviewSessionStudyService;
import com.interviewmate.service.InterviewSessionTimelineService;
import com.interviewmate.service.InterviewSessionEndService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class InterviewSessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private InterviewSessionService interviewSessionService;

    @MockBean
    private InterviewSessionReportService interviewSessionReportService;

    @MockBean
    private InterviewSessionStateService interviewSessionStateService;

    @MockBean
    private InterviewSessionStudyService interviewSessionStudyService;

    @MockBean
    private InterviewSessionTimelineService interviewSessionTimelineService;

    @MockBean
    private InterviewSessionEndService interviewSessionEndService;

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
        userRepository.deleteAll();
        jdbcTemplate.update("INSERT INTO users (id, api_key, created_at, updated_at) VALUES (1, 'test-key', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
    }

    @Test
    void testStartInterviewSessionReturns200() throws Exception {
        InterviewSessionStartResponse mockResponse = InterviewSessionStartResponse.builder()
                .sessionId("session-123")
                .jobRole("backend")
                .interviewerCharacter("jet")
                .totalQuestions(7)
                .status("in_progress")
                .startedAt(LocalDateTime.now())
                .firstQuestion(InterviewSessionStartResponse.FirstQuestionDto.builder()
                        .questionId("q-1")
                        .category("job")
                        .difficulty("medium")
                        .content("트랜잭션의 ACID를 설명해보세요.")
                        .build())
                .build();

        when(interviewSessionService.startSession(any(), anyLong())).thenReturn(mockResponse);

        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");
        request.setStack("Spring Boot");
        request.setDifficulty("jobseeker");

        mockMvc.perform(post("/api/interview/sessions/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-API-Key", "test-key")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.session_id").value("session-123"))
                .andExpect(jsonPath("$.data.job_role").value("backend"))
                .andExpect(jsonPath("$.data.interviewer_character").value("jet"))
                .andExpect(jsonPath("$.data.total_questions").value(7))
                .andExpect(jsonPath("$.data.status").value("in_progress"))
                .andExpect(jsonPath("$.data.first_question.question_id").value("q-1"));
    }

    @Test
    void testStartInterviewSessionAcceptsExtendedRole() throws Exception {
        InterviewSessionStartResponse mockResponse = InterviewSessionStartResponse.builder()
                .sessionId("session-pm")
                .jobRole("pm")
                .interviewerCharacter("jet")
                .totalQuestions(7)
                .status("in_progress")
                .startedAt(LocalDateTime.now())
                .firstQuestion(InterviewSessionStartResponse.FirstQuestionDto.builder()
                        .questionId("q-pm-1")
                        .category("job")
                        .difficulty("easy")
                        .content("PM 우선순위 기준을 설명해보세요.")
                        .build())
                .build();

        when(interviewSessionService.startSession(any(), anyLong())).thenReturn(mockResponse);

        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("pm");
        request.setStack("PRD");
        request.setDifficulty("jobseeker");

        mockMvc.perform(post("/api/interview/sessions/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-API-Key", "test-key")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.job_role").value("pm"));
    }

    @Test
    void testStartInterviewSessionWithInvalidRoleReturns400() throws Exception {
        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("ios");
        request.setStack("Spring Boot");
        request.setDifficulty("jobseeker");

        mockMvc.perform(post("/api/interview/sessions/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-API-Key", "test-key")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    @Test
    void testStartInterviewSessionWithInvalidCharacterReturns400() throws Exception {
        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");
        request.setStack("Spring Boot");
        request.setDifficulty("jobseeker");
        request.setInterviewerCharacter("alpha");

        mockMvc.perform(post("/api/interview/sessions/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-API-Key", "test-key")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    @Test
    void testStartInterviewSessionWithoutStackReturns400() throws Exception {
        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");
        request.setDifficulty("jobseeker");

        mockMvc.perform(post("/api/interview/sessions/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-API-Key", "test-key")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    @Test
    void testStartInterviewSessionWithInvalidDifficultyReturns400() throws Exception {
        InterviewSessionStartRequest request = new InterviewSessionStartRequest();
        request.setJobRole("backend");
        request.setStack("Spring Boot");
        request.setDifficulty("senior");

        mockMvc.perform(post("/api/interview/sessions/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-API-Key", "test-key")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    @Test
    void testGetSessionReportReturns200() throws Exception {
        InterviewSessionReportResponse mockResponse = InterviewSessionReportResponse.builder()
                .sessionId("10")
                .jobRole("backend")
                .sessionStatus("completed")
                .endReason("completed_all_questions")
                .totalQuestions(7)
                .answeredQuestions(7)
                .generatedAt(LocalDateTime.now())
                .scoreSummary(InterviewSessionReportResponse.ScoreSummary.builder()
                        .accuracy(3.4)
                        .logic(3.5)
                        .depth(3.3)
                        .delivery(3.6)
                        .totalScore(3.5)
                        .build())
                .build();

        when(interviewSessionReportService.getSessionReport(anyLong(), anyLong())).thenReturn(mockResponse);

        mockMvc.perform(get("/api/interview/sessions/10/report")
                        .header("X-API-Key", "test-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.session_id").value("10"))
                .andExpect(jsonPath("$.data.session_status").value("completed"))
                .andExpect(jsonPath("$.data.end_reason").value("completed_all_questions"))
                .andExpect(jsonPath("$.data.score_summary.total_score").value(3.5));
    }

    @Test
    void testGetSessionStateReturns200() throws Exception {
        InterviewSessionStateResponse mockResponse = InterviewSessionStateResponse.builder()
                .sessionId("10")
                .status("in_progress")
                .endReason(null)
                .jobRole("backend")
                .stack("Spring Boot,Redis")
                .difficulty("junior")
                .interviewerCharacter("jet")
                .totalQuestions(7)
                .answeredQuestions(2)
                .remainingQuestions(5)
                .completionRate(28.6)
                .updatedAt(LocalDateTime.now())
                .currentQuestion(InterviewSessionStateResponse.CurrentQuestionDto.builder()
                        .questionId("103")
                        .questionOrder(3)
                        .category("cs")
                        .difficulty("medium")
                        .content("트랜잭션 격리 수준을 설명해보세요.")
                        .followupCount(1)
                        .build())
                .build();

        when(interviewSessionStateService.getSessionState(anyLong(), anyLong())).thenReturn(mockResponse);

        mockMvc.perform(get("/api/interview/sessions/10")
                        .header("X-API-Key", "test-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.session_id").value("10"))
                .andExpect(jsonPath("$.data.status").value("in_progress"))
                .andExpect(jsonPath("$.data.end_reason").doesNotExist())
                .andExpect(jsonPath("$.data.stack").value("Spring Boot,Redis"))
                .andExpect(jsonPath("$.data.difficulty").value("junior"))
                .andExpect(jsonPath("$.data.interviewer_character").value("jet"))
                .andExpect(jsonPath("$.data.answered_questions").value(2))
                .andExpect(jsonPath("$.data.remaining_questions").value(5))
                .andExpect(jsonPath("$.data.completion_rate").value(28.6))
                .andExpect(jsonPath("$.data.current_question.question_id").value("103"))
                .andExpect(jsonPath("$.data.current_question.followup_count").value(1));
    }

    @Test
    void testGetLatestActiveSessionReturns200() throws Exception {
        LatestActiveSessionResponse mockResponse = LatestActiveSessionResponse.builder()
                .hasActiveSession(true)
                .session(InterviewSessionStateResponse.builder()
                        .sessionId("22")
                        .status("in_progress")
                        .endReason(null)
                        .jobRole("backend")
                        .stack("Spring Boot")
                        .difficulty("jobseeker")
                        .interviewerCharacter("luna")
                        .totalQuestions(7)
                        .answeredQuestions(3)
                        .remainingQuestions(4)
                        .completionRate(42.9)
                        .updatedAt(LocalDateTime.now())
                        .currentQuestion(InterviewSessionStateResponse.CurrentQuestionDto.builder()
                                .questionId("204")
                                .questionOrder(4)
                                .category("job")
                                .difficulty("medium")
                                .content("캐시 무효화 전략을 설명해보세요.")
                                .followupCount(0)
                                .build())
                        .build())
                .build();

        when(interviewSessionStateService.getLatestActiveSession(anyLong())).thenReturn(mockResponse);

        mockMvc.perform(get("/api/interview/sessions/latest-active")
                        .header("X-API-Key", "test-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.has_active_session").value(true))
                .andExpect(jsonPath("$.data.session.session_id").value("22"))
                .andExpect(jsonPath("$.data.session.stack").value("Spring Boot"))
                .andExpect(jsonPath("$.data.session.difficulty").value("jobseeker"))
                .andExpect(jsonPath("$.data.session.interviewer_character").value("luna"))
                .andExpect(jsonPath("$.data.session.current_question.question_order").value(4));
    }

    @Test
    void testGetSessionStudyGuideReturns200() throws Exception {
        InterviewSessionStudyResponse mockResponse = InterviewSessionStudyResponse.builder()
                .sessionId("10")
                .jobRole("backend")
                .performanceLevel("needs_improvement")
                .weakKeywords(java.util.List.of("정확성", "깊이"))
                .recommendedActions(java.util.List.of("핵심 개념 정의를 먼저 제시하세요."))
                .questionGuides(java.util.List.of(
                        InterviewSessionStudyResponse.QuestionStudyGuide.builder()
                                .questionOrder(1)
                                .questionContent("트랜잭션의 ACID를 설명해보세요.")
                                .interviewerEmotion("pressure")
                                .weakConceptKeywords(java.util.List.of("핵심 개념 정의"))
                                .modelAnswerPreview("모범답안 요약")
                                .actionTip("결론-근거-예시 구조로 답변하세요.")
                                .build()
                ))
                .build();

        when(interviewSessionStudyService.getStudyGuide(anyLong(), anyLong())).thenReturn(mockResponse);

        mockMvc.perform(get("/api/interview/sessions/10/study")
                        .header("X-API-Key", "test-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.session_id").value("10"))
                .andExpect(jsonPath("$.data.performance_level").value("needs_improvement"))
                .andExpect(jsonPath("$.data.question_guides[0].question_order").value(1))
                .andExpect(jsonPath("$.data.question_guides[0].interviewer_emotion").value("pressure"));
    }

    @Test
    void testGetSessionTimelineReturns200() throws Exception {
        InterviewSessionTimelineResponse mockResponse = InterviewSessionTimelineResponse.builder()
                .sessionId("10")
                .jobRole("backend")
                .interviewerCharacter("jet")
                .sessionStatus("in_progress")
                .endReason(null)
                .summary(InterviewSessionTimelineResponse.TimelineSummary.builder()
                        .pressureCount(0)
                        .encourageCount(1)
                        .neutralCount(0)
                        .scoredCount(1)
                        .averageScore(4.1)
                        .build())
                .items(java.util.List.of(
                        InterviewSessionTimelineResponse.TimelineItem.builder()
                                .answerId("900")
                                .questionId("100")
                                .questionOrder(1)
                                .questionContent("트랜잭션의 ACID를 설명해보세요.")
                                .answerText("ACID는 원자성, 일관성, 고립성, 지속성입니다.")
                                .interviewerEmotion("encourage")
                                .scoreTotal(4.1)
                                .followupReason("none")
                                .answeredAt(LocalDateTime.now())
                                .build()
                ))
                .build();

        when(interviewSessionTimelineService.getTimeline(anyLong(), anyLong())).thenReturn(mockResponse);

        mockMvc.perform(get("/api/interview/sessions/10/timeline")
                        .header("X-API-Key", "test-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.session_id").value("10"))
                .andExpect(jsonPath("$.data.interviewer_character").value("jet"))
                .andExpect(jsonPath("$.data.end_reason").doesNotExist())
                .andExpect(jsonPath("$.data.summary.average_score").value(4.1))
                .andExpect(jsonPath("$.data.items[0].interviewer_emotion").value("encourage"))
                .andExpect(jsonPath("$.data.items[0].score_total").value(4.1));
    }

    @Test
    void testEndSessionReturns200() throws Exception {
        InterviewSessionEndResponse mockResponse = InterviewSessionEndResponse.builder()
                .sessionId("10")
                .sessionStatus("completed")
                .endReason("user_end")
                .endedAt(LocalDateTime.now())
                .build();

        when(interviewSessionEndService.endSession(anyLong(), anyLong(), nullable(String.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/interview/sessions/10/end")
                        .header("X-API-Key", "test-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.session_id").value("10"))
                .andExpect(jsonPath("$.data.session_status").value("completed"))
                .andExpect(jsonPath("$.data.end_reason").value("user_end"));
    }

    @Test
    void testEndSessionWithExplicitReasonReturns200() throws Exception {
        InterviewSessionEndResponse mockResponse = InterviewSessionEndResponse.builder()
                .sessionId("11")
                .sessionStatus("completed")
                .endReason("completed_all_questions")
                .endedAt(LocalDateTime.now())
                .build();

        when(interviewSessionEndService.endSession(eq(11L), anyLong(), eq("completed_all_questions")))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/interview/sessions/11/end")
                        .header("X-API-Key", "test-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"completed_all_questions\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.session_id").value("11"))
                .andExpect(jsonPath("$.data.session_status").value("completed"))
                .andExpect(jsonPath("$.data.end_reason").value("completed_all_questions"));
    }

    @Test
    void testEndSessionWithInvalidReasonReturns400() throws Exception {
        mockMvc.perform(post("/api/interview/sessions/11/end")
                        .header("X-API-Key", "test-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"invalid_reason\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }
}
