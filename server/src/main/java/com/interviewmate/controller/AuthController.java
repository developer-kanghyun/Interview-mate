package com.interviewmate.controller;

import com.interviewmate.dto.common.ApiResponse;
import com.interviewmate.dto.response.AuthMeResponse;
import com.interviewmate.dto.response.GuestAuthResponse;
import com.interviewmate.dto.response.GoogleAuthLoginResponse;
import com.interviewmate.dto.response.GoogleAuthUrlResponse;
import com.interviewmate.global.auth.AuthenticatedUserId;
import com.interviewmate.service.AuthUserService;
import com.interviewmate.service.GuestAuthService;
import com.interviewmate.service.GoogleAuthCallbackService;
import com.interviewmate.service.GoogleAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final GoogleAuthService googleAuthService;
    private final GoogleAuthCallbackService googleAuthCallbackService;
    private final GuestAuthService guestAuthService;
    private final AuthUserService authUserService;

    @GetMapping("/google/url")
    public ResponseEntity<ApiResponse<GoogleAuthUrlResponse>> getGoogleAuthUrl() {
        GoogleAuthUrlResponse response = googleAuthService.buildAuthorizationUrl();
        log.info("Google OAuth URL 발급 요청 처리");
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/google/callback")
    public ResponseEntity<ApiResponse<GoogleAuthLoginResponse>> handleGoogleCallback(
            @RequestParam("code") String code,
            @RequestParam(value = "state", required = false) String state,
            @RequestHeader(value = "X-Guest-Api-Key", required = false) String guestApiKey) {
        GoogleAuthLoginResponse response = googleAuthCallbackService.loginWithGoogleCode(code, state, guestApiKey);
        log.info("Google OAuth callback 처리 완료");
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/guest")
    public ResponseEntity<ApiResponse<GuestAuthResponse>> issueGuestAccess() {
        GuestAuthResponse response = guestAuthService.issueGuestAccess();
        log.info("Guest access 발급 완료: userId={}", response.getUserId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthMeResponse>> getMyProfile(@AuthenticatedUserId Long userId) {
        AuthMeResponse response = authUserService.getMyProfile(userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
