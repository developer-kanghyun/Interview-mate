package com.interviewmate.controller;

import com.interviewmate.dto.response.InterviewHistoryResponse;
import com.interviewmate.repository.UserRepository;
import com.interviewmate.service.InterviewHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class InterviewHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private InterviewHistoryService interviewHistoryService;

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
    void testGetHistoryReturns200() throws Exception {
        InterviewHistoryResponse mockResponse = InterviewHistoryResponse.builder()
                .requestedDays(30)
                .totalCount(1)
                .items(List.of(
                        InterviewHistoryResponse.HistoryItem.builder()
                                .sessionId("40")
                                .sessionEndReason("user_end")
                                .questionId("401")
                                .questionOrder(1)
                                .questionContent("REST와 RPC 차이를 설명해보세요.")
                                .answerText("REST는 리소스 중심입니다.")
                                .inputType("text")
                                .interviewerEmotion("neutral")
                                .totalScore(3.2)
                                .followupReason("none")
                                .answeredAt(LocalDateTime.now())
                                .build()
                ))
                .build();

        when(interviewHistoryService.getHistory(anyLong(), any())).thenReturn(mockResponse);

        mockMvc.perform(get("/api/interview/history")
                        .header("X-API-Key", "test-key")
                        .param("days", "30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.requested_days").value(30))
                .andExpect(jsonPath("$.data.total_count").value(1))
                .andExpect(jsonPath("$.data.items[0].session_id").value("40"))
                .andExpect(jsonPath("$.data.items[0].session_end_reason").value("user_end"))
                .andExpect(jsonPath("$.data.items[0].interviewer_emotion").value("neutral"));
    }

    @Test
    void testGetHistoryReturns400WhenDaysOutOfRange() throws Exception {
        mockMvc.perform(get("/api/interview/history")
                        .header("X-API-Key", "test-key")
                        .param("days", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    @Test
    void testGetHistoryReturns400WhenDaysExceedsMax() throws Exception {
        mockMvc.perform(get("/api/interview/history")
                        .header("X-API-Key", "test-key")
                        .param("days", "91"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }
}
