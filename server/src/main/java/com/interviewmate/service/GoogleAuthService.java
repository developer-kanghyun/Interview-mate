package com.interviewmate.service;

import com.interviewmate.dto.response.GoogleAuthUrlResponse;
import com.interviewmate.global.error.AppException;
import com.interviewmate.global.error.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class GoogleAuthService {
    private static final Pattern GOOGLE_CLIENT_ID_PATTERN = Pattern.compile(
            "^[0-9]+-[a-z0-9._-]+\\.apps\\.googleusercontent\\.com$",
            Pattern.CASE_INSENSITIVE
    );
    private static final String[] GOOGLE_CLIENT_ID_PLACEHOLDER_TOKENS = {
            "your",
            "replace",
            "example",
            "empty",
            "dummy"
    };

    @Value("${app.auth.google.client-id:}")
    private String googleClientId;

    @Value("${app.auth.google.redirect-uri:http://localhost:3000/auth/google/callback}")
    private String googleRedirectUri;

    private final GoogleOAuthStateService googleOAuthStateService;

    public GoogleAuthService(GoogleOAuthStateService googleOAuthStateService) {
        this.googleOAuthStateService = googleOAuthStateService;
    }

    public GoogleAuthUrlResponse buildAuthorizationUrl() {
        validateOAuthConfiguration();
        String state = googleOAuthStateService.generateState();
        String encodedRedirectUri = urlEncode(googleRedirectUri);
        String encodedScope = urlEncode("openid profile email");

        String authUrl = "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + urlEncode(googleClientId)
                + "&redirect_uri=" + encodedRedirectUri
                + "&response_type=code"
                + "&scope=" + encodedScope
                + "&state=" + urlEncode(state)
                + "&access_type=offline"
                + "&prompt=consent";

        return GoogleAuthUrlResponse.builder()
                .authUrl(authUrl)
                .state(state)
                .build();
    }

    private void validateOAuthConfiguration() {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new AppException(ErrorCode.INVALID_INPUT, "Google OAuth Client ID 설정이 필요합니다.");
        }
        String normalizedClientId = googleClientId.trim();
        String loweredClientId = normalizedClientId.toLowerCase(Locale.ROOT);
        for (String placeholderToken : GOOGLE_CLIENT_ID_PLACEHOLDER_TOKENS) {
            if (loweredClientId.contains(placeholderToken)) {
                throw new AppException(ErrorCode.INVALID_INPUT, "Google OAuth Client ID 설정이 필요합니다.");
            }
        }
        if (!GOOGLE_CLIENT_ID_PATTERN.matcher(normalizedClientId).matches()) {
            throw new AppException(ErrorCode.INVALID_INPUT, "Google OAuth Client ID 형식이 올바르지 않습니다.");
        }
        if (googleRedirectUri == null || googleRedirectUri.isBlank()) {
            throw new AppException(ErrorCode.INVALID_INPUT, "Google OAuth Redirect URI 설정이 필요합니다.");
        }
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }
}
