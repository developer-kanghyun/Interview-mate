package com.interviewmate.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient(timeout = "30000")
@ActiveProfiles("test")
@Testcontainers
class TtsAuthIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    @DisplayName("TTS API requires API key")
    void ttsApiRequiresApiKey() {
        webTestClient.post()
                .uri("/api/tts/synthesize")
                .bodyValue("{\"text\":\"테스트\",\"character\":\"zet\"}")
                .header("Content-Type", "application/json")
                .exchange()
                .expectStatus().isUnauthorized();
    }
}
