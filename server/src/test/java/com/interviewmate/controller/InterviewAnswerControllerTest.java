package com.interviewmate.controller;

import com.interviewmate.dto.request.InterviewAnswerSubmitRequest;
import com.interviewmate.dto.response.InterviewAnswerSubmitResponse;
import com.interviewmate.repository.UserRepository;
import com.interviewmate.service.InterviewAnswerService;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class InterviewAnswerControllerTest {
    private static final int MAX_ANSWER_TEXT_LENGTH = 2000;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private InterviewAnswerService interviewAnswerService;

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
    void testSubmitAnswerReturns200() throws Exception {
        InterviewAnswerSubmitRequest request = new InterviewAnswerSubmitRequest();
        request.setQuestionId(100L);
        request.setAnswerText("트랜잭션은 원자성, 일관성, 고립성, 지속성을 보장합니다.");
        request.setInputType("text");

        InterviewAnswerSubmitResponse mockResponse = InterviewAnswerSubmitResponse.builder()
                .answerId("900")
                .sessionId("10")
                .questionId("100")
                .inputType("text")
                .interviewerCharacter("jet")
                .submittedAt(LocalDateTime.now())
                .evaluation(InterviewAnswerSubmitResponse.EvaluationDto.builder()
                        .accuracy(3.8)
                        .logic(3.6)
                        .depth(3.7)
                        .delivery(3.5)
                        .totalScore(3.7)
                        .followupRequired(false)
                        .followupReason("none")
                        .followupRemaining(2)
                        .build())
                .coachingMessage("강점은 유지하고 전달력을 조금 더 보강해보세요.")
                .interviewerEmotion("encourage")
                .nextQuestion(InterviewAnswerSubmitResponse.NextQuestionDto.builder()
                        .questionId("101")
                        .questionOrder(2)
                        .category("cs")
                        .difficulty("easy")
                        .content("REST와 RPC 차이를 설명해보세요.")
                        .build())
                .sessionStatus("in_progress")
                .endReason(null)
                .sessionCompleted(false)
                .build();

        when(interviewAnswerService.submitAnswer(anyLong(), any())).thenReturn(mockResponse);

        mockMvc.perform(post("/api/interview/sessions/10/answers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-API-Key", "test-key")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.answer_id").value("900"))
                .andExpect(jsonPath("$.data.session_id").value("10"))
                .andExpect(jsonPath("$.data.question_id").value("100"))
                .andExpect(jsonPath("$.data.interviewer_character").value("jet"))
                .andExpect(jsonPath("$.data.evaluation.total_score").value(3.7))
                .andExpect(jsonPath("$.data.evaluation.followup_required").value(false))
                .andExpect(jsonPath("$.data.evaluation.followup_remaining").value(2))
                .andExpect(jsonPath("$.data.coaching_message").value("강점은 유지하고 전달력을 조금 더 보강해보세요."))
                .andExpect(jsonPath("$.data.interviewer_emotion").value("encourage"))
                .andExpect(jsonPath("$.data.next_question.question_id").value("101"))
                .andExpect(jsonPath("$.data.session_status").value("in_progress"))
                .andExpect(jsonPath("$.data.end_reason").doesNotExist())
                .andExpect(jsonPath("$.data.session_completed").value(false));
    }

    @Test
    void testSubmitAnswerWithTooLongAnswerReturns400() throws Exception {
        InterviewAnswerSubmitRequest request = new InterviewAnswerSubmitRequest();
        request.setQuestionId(100L);
        request.setAnswerText("a".repeat(MAX_ANSWER_TEXT_LENGTH + 1));
        request.setInputType("text");

        mockMvc.perform(post("/api/interview/sessions/10/answers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-API-Key", "test-key")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    @Test
    void testSubmitAnswerWithMaxLengthAllowedReturns200() throws Exception {
        InterviewAnswerSubmitRequest request = new InterviewAnswerSubmitRequest();
        request.setQuestionId(100L);
        request.setAnswerText("a".repeat(MAX_ANSWER_TEXT_LENGTH));
        request.setInputType("text");

        InterviewAnswerSubmitResponse mockResponse = InterviewAnswerSubmitResponse.builder()
                .answerId("901")
                .sessionId("10")
                .questionId("100")
                .inputType("text")
                .interviewerCharacter("jet")
                .submittedAt(LocalDateTime.now())
                .evaluation(InterviewAnswerSubmitResponse.EvaluationDto.builder()
                        .accuracy(3.0)
                        .logic(3.0)
                        .depth(3.0)
                        .delivery(3.0)
                        .totalScore(3.0)
                        .followupRequired(false)
                        .followupReason("none")
                        .followupRemaining(2)
                        .build())
                .coachingMessage("다음 답변에서는 핵심 키워드와 실무 예시를 함께 제시하면 더 좋아집니다.")
                .interviewerEmotion("neutral")
                .sessionStatus("in_progress")
                .endReason(null)
                .sessionCompleted(false)
                .build();

        when(interviewAnswerService.submitAnswer(anyLong(), any())).thenReturn(mockResponse);

        mockMvc.perform(post("/api/interview/sessions/10/answers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-API-Key", "test-key")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.answer_id").value("901"));
    }
}
