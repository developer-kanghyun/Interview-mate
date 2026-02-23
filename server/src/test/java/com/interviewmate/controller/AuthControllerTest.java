package com.interviewmate.controller;

import com.interviewmate.dto.response.GoogleAuthUrlResponse;
import com.interviewmate.entity.User;
import com.interviewmate.repository.UserRepository;
import com.interviewmate.service.AuthUserService;
import com.interviewmate.service.GoogleAuthCallbackService;
import com.interviewmate.service.GoogleAuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class AuthControllerTest {

    private Long seededUserId;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private GoogleAuthService googleAuthService;

    @MockBean
    private GoogleAuthCallbackService googleAuthCallbackService;

    @MockBean
    private AuthUserService authUserService;

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

        User seededUser = new User();
        seededUser.setApiKey("test-key");
        seededUser.setName("테스터");
        seededUser.setIsGuest(false);
        seededUserId = userRepository.save(seededUser).getId();
    }

    @Test
    void testGetGoogleAuthUrlReturns200WithoutApiKey() throws Exception {
        when(googleAuthService.buildAuthorizationUrl())
                .thenReturn(GoogleAuthUrlResponse.builder()
                        .authUrl("https://accounts.google.com/o/oauth2/v2/auth?client_id=test")
                        .state("state-123")
                        .build());

        mockMvc.perform(get("/api/auth/google/url"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.auth_url").exists())
                .andExpect(jsonPath("$.data.state").value("state-123"));
    }

    @Test
    void testGoogleCallbackReturnsApiKeyWithoutApiKeyHeader() throws Exception {
        when(googleAuthCallbackService.loginWithGoogleCode("code-123", "state-123", null))
                .thenReturn(com.interviewmate.dto.response.GoogleAuthLoginResponse.builder()
                        .apiKey("im_test_api_key")
                        .userId("1")
                        .email("test@example.com")
                        .name("Tester")
                        .newUser(true)
                        .build());

        mockMvc.perform(get("/api/auth/google/callback")
                        .param("code", "code-123")
                        .param("state", "state-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.api_key").value("im_test_api_key"))
                .andExpect(jsonPath("$.data.new_user").value(true));
    }

    @Test
    void testGoogleCallbackPassesGuestApiKeyHeader() throws Exception {
        when(googleAuthCallbackService.loginWithGoogleCode("code-123", "state-123", "guest-key"))
                .thenReturn(com.interviewmate.dto.response.GoogleAuthLoginResponse.builder()
                        .apiKey("im_member_api_key")
                        .userId("2")
                        .email("member@example.com")
                        .name("Member")
                        .newUser(false)
                        .build());

        mockMvc.perform(get("/api/auth/google/callback")
                        .param("code", "code-123")
                        .param("state", "state-123")
                        .header("X-Guest-Api-Key", "guest-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.api_key").value("im_member_api_key"))
                .andExpect(jsonPath("$.data.new_user").value(false));
    }

    @Test
    void testGetMyProfileReturns200WithApiKeyHeader() throws Exception {
        when(authUserService.getMyProfile(seededUserId))
                .thenReturn(com.interviewmate.dto.response.AuthMeResponse.builder()
                        .userId(String.valueOf(seededUserId))
                        .email("tester@example.com")
                        .name("테스터")
                        .build());

        mockMvc.perform(get("/api/auth/me")
                        .header("X-API-Key", "test-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user_id").value(String.valueOf(seededUserId)))
                .andExpect(jsonPath("$.data.email").value("tester@example.com"))
                .andExpect(jsonPath("$.data.name").value("테스터"));
    }

    @Test
    void testGetGuestAccessReturns200WithoutApiKeyHeader() throws Exception {
        mockMvc.perform(get("/api/auth/guest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.api_key").isNotEmpty())
                .andExpect(jsonPath("$.data.trial_question_limit").value(1));
    }
}
