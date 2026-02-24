package com.interviewmate.infrastructure.tts;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class GoogleTtsAdapterTest {

    private MockWebServer mockWebServer;
    private GoogleTtsAdapter googleTtsAdapter;

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        String baseUrl = mockWebServer.url("/").toString();
        
        googleTtsAdapter = new GoogleTtsAdapter(
                WebClient.builder().baseUrl(baseUrl).build(),
                "test-api-key"
        );
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    @Test
    @DisplayName("Successfully synthesizes TTS and decodes Base64 to return audio bytes")
    void synthesize_Success() throws Exception {
        // Given
        // "SGVsbG8=" is Base64 for "Hello"
        String mockResponseBody = """
                {
                  "audioContent": "SGVsbG8="
                }
                """;
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .addHeader("Content-Type", "application/json")
                .setBody(mockResponseBody));

        // When
        byte[] result = googleTtsAdapter.synthesize("안녕하세요", "ko-KR-Neural2-c", "mp3", 1.0);

        // Then
        assertThat(result).isEqualTo("Hello".getBytes());

        RecordedRequest recordedRequest = mockWebServer.takeRequest();
        assertThat(recordedRequest.getMethod()).isEqualTo("POST");
        assertThat(recordedRequest.getPath()).isEqualTo("/v1/text:synthesize?key=test-api-key");
        
        String requestBody = recordedRequest.getBody().readUtf8();
        assertThat(requestBody).contains("안녕하세요");
        assertThat(requestBody).contains("ko-KR-Neural2-c");
        assertThat(requestBody).contains("\"speakingRate\":1.0");
    }
}
