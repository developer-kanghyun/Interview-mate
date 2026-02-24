package com.interviewmate.service;

import com.interviewmate.global.error.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GoogleAuthServiceTest {

    private GoogleAuthService googleAuthService;

    @BeforeEach
    void setUp() {
        GoogleOAuthStateService stateService = new GoogleOAuthStateService();
        ReflectionTestUtils.setField(stateService, "stateSecret", "test-secret");
        ReflectionTestUtils.setField(stateService, "stateTtlSeconds", 600L);
        googleAuthService = new GoogleAuthService(stateService);
        ReflectionTestUtils.setField(googleAuthService, "googleRedirectUri", "http://localhost:3000/auth/google/callback");
    }

    @Test
    void testBuildAuthorizationUrlWithValidClientId() {
        ReflectionTestUtils.setField(
                googleAuthService,
                "googleClientId",
                "123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com"
        );

        String authUrl = googleAuthService.buildAuthorizationUrl().getAuthUrl();

        assertThat(authUrl).contains("client_id=123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com");
        assertThat(authUrl).contains("redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fgoogle%2Fcallback");
    }

    @Test
    void testBuildAuthorizationUrlRejectsPlaceholderClientId() {
        ReflectionTestUtils.setField(googleAuthService, "googleClientId", "your-google-client-id");

        assertThatThrownBy(() -> googleAuthService.buildAuthorizationUrl())
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Google OAuth Client ID 설정이 필요합니다.");
    }

    @Test
    void testBuildAuthorizationUrlRejectsInvalidClientIdFormat() {
        ReflectionTestUtils.setField(googleAuthService, "googleClientId", "AIzaSyBWpaex");

        assertThatThrownBy(() -> googleAuthService.buildAuthorizationUrl())
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Google OAuth Client ID 형식이 올바르지 않습니다.");
    }
}
