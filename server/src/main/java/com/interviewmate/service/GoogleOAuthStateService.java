package com.interviewmate.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
public class GoogleOAuthStateService {

    @Value("${app.auth.google.state-secret:interview-mate-default-state-secret}")
    private String stateSecret;

    @Value("${app.auth.google.state-ttl-seconds:600}")
    private long stateTtlSeconds;

    public String generateState() {
        long issuedAtEpochSecond = Instant.now().getEpochSecond();
        String nonce = UUID.randomUUID().toString().replace("-", "");
        String payload = nonce + "." + issuedAtEpochSecond;
        String signature = sign(payload);
        String token = payload + "." + signature;
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }

    public boolean isValidState(String encodedState) {
        if (encodedState == null || encodedState.isBlank()) {
            return false;
        }
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(encodedState);
            String token = new String(decoded, StandardCharsets.UTF_8);
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return false;
            }
            String nonce = parts[0];
            String issuedAt = parts[1];
            String signature = parts[2];
            if (nonce.isBlank() || issuedAt.isBlank() || signature.isBlank()) {
                return false;
            }

            long issuedAtEpochSecond = Long.parseLong(issuedAt);
            long nowEpochSecond = Instant.now().getEpochSecond();
            if (nowEpochSecond - issuedAtEpochSecond > stateTtlSeconds) {
                return false;
            }

            String payload = nonce + "." + issuedAt;
            String expectedSignature = sign(payload);
            return expectedSignature.equals(signature);
        } catch (Exception ignored) {
            return false;
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(stateSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] signature = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        } catch (Exception exception) {
            throw new IllegalStateException("state 서명 생성에 실패했습니다.", exception);
        }
    }
}
