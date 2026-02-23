package com.interviewmate.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.interviewmate.global.error.AppException;
import com.interviewmate.global.error.ErrorCode;

@Component
public class GoogleOAuthClient {

    private final RestClient restClient;

    @Value("${app.auth.google.client-id:}")
    private String googleClientId;

    @Value("${app.auth.google.client-secret:}")
    private String googleClientSecret;

    @Value("${app.auth.google.redirect-uri:http://localhost:3000/auth/google/callback}")
    private String googleRedirectUri;

    @Value("${app.auth.google.token-uri:https://oauth2.googleapis.com/token}")
    private String googleTokenUri;

    @Value("${app.auth.google.userinfo-uri:https://openidconnect.googleapis.com/v1/userinfo}")
    private String googleUserInfoUri;

    public GoogleOAuthClient(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    public String exchangeCodeForAccessToken(String code) {
        validateOAuthConfiguration();
        MultiValueMap<String, String> formBody = new LinkedMultiValueMap<>();
        formBody.add("code", code);
        formBody.add("client_id", googleClientId);
        formBody.add("client_secret", googleClientSecret);
        formBody.add("redirect_uri", googleRedirectUri);
        formBody.add("grant_type", "authorization_code");

        try {
            GoogleTokenResponse tokenResponse = restClient.post()
                    .uri(googleTokenUri)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formBody)
                    .retrieve()
                    .body(GoogleTokenResponse.class);

            return tokenResponse == null ? null : tokenResponse.accessToken();
        } catch (RestClientException exception) {
            throw new AppException(ErrorCode.INVALID_INPUT, "Google access token 교환에 실패했습니다.");
        }
    }

    public GoogleUserInfo getUserInfo(String accessToken) {
        validateOAuthConfiguration();
        try {
            GoogleUserInfoResponse userInfoResponse = restClient.get()
                    .uri(googleUserInfoUri)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(GoogleUserInfoResponse.class);

            if (userInfoResponse == null) {
                return null;
            }

            return GoogleUserInfo.builder()
                    .sub(defaultString(userInfoResponse.sub()))
                    .email(defaultString(userInfoResponse.email()))
                    .name(defaultString(userInfoResponse.name()))
                    .build();
        } catch (RestClientException exception) {
            throw new AppException(ErrorCode.INVALID_INPUT, "Google 사용자 정보 조회에 실패했습니다.");
        }
    }

    private String defaultString(String value) {
        return value == null ? "" : value;
    }

    private void validateOAuthConfiguration() {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new AppException(ErrorCode.INVALID_INPUT, "Google OAuth Client ID 설정이 필요합니다.");
        }
        if (googleClientSecret == null || googleClientSecret.isBlank()) {
            throw new AppException(ErrorCode.INVALID_INPUT, "Google OAuth Client Secret 설정이 필요합니다.");
        }
        if (googleRedirectUri == null || googleRedirectUri.isBlank()) {
            throw new AppException(ErrorCode.INVALID_INPUT, "Google OAuth Redirect URI 설정이 필요합니다.");
        }
    }

    private record GoogleTokenResponse(@JsonProperty("access_token") String accessToken) {
    }

    private record GoogleUserInfoResponse(String sub, String email, String name) {
    }

    @lombok.Builder
    @lombok.Getter
    public static class GoogleUserInfo {
        private String sub;
        private String email;
        private String name;
    }
}
