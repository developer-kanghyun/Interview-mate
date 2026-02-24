package com.interviewmate.controller;

import com.interviewmate.application.port.out.TtsPort;
import com.interviewmate.global.config.TtsProperties;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = TtsController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {
                        com.interviewmate.global.config.SecurityConfig.class,
                        com.interviewmate.global.auth.ApiKeyAuthFilter.class,
                        com.interviewmate.global.ratelimit.RateLimitFilter.class,
                        com.interviewmate.global.config.HttpLoggingFilter.class
                }
        ),
        excludeAutoConfiguration = {
                org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
        }
)
class TtsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TtsPort ttsPort;

    @MockBean
    private TtsProperties ttsProperties;

    @MockBean
    private com.interviewmate.global.ratelimit.RateLimitResponseFactory rateLimitResponseFactory;

    @Test
    @DisplayName("Synthesize API returns audio/mpeg bytes successfully")
    void synthesizeAPI_Success() throws Exception {
        // Given
        byte[] mockAudioBytes = "mock-audio".getBytes();
        when(ttsProperties.getVoiceByCharacter()).thenReturn(Map.of(
                "zet", "ko-KR-Neural2-c",
                "luna", "ko-KR-Neural2-b",
                "iron", "ko-KR-Neural2-d"
        ));
        when(ttsPort.synthesize(eq("안녕하세요"), eq("ko-KR-Neural2-c"), eq("mp3"), any())).thenReturn(mockAudioBytes);

        String requestJson = """
                {
                  "text": "안녕하세요",
                  "character": "zet",
                  "format": "mp3",
                  "speakingRate": 1.0
                }
                """;

        // When & Then
        mockMvc.perform(post("/api/tts/synthesize")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("audio/mpeg"))
                .andExpect(content().bytes(mockAudioBytes));
    }

    @Test
    @DisplayName("Character and speakingRate are mapped before synthesize call")
    void synthesizeAPI_MapsCharacterAndRate() throws Exception {
        byte[] mockAudioBytes = "mock-audio".getBytes();
        when(ttsProperties.getVoiceByCharacter()).thenReturn(Map.of(
                "zet", "ko-KR-Neural2-c",
                "luna", "ko-KR-Neural2-b",
                "iron", "ko-KR-Neural2-d"
        ));
        when(ttsPort.synthesize(eq("테스트 음성"), eq("ko-KR-Neural2-b"), eq("mp3"), eq(1.25))).thenReturn(mockAudioBytes);

        String requestJson = """
                {
                  "text": "테스트 음성",
                  "character": "luna",
                  "format": "mp3",
                  "speakingRate": 1.25
                }
                """;

        mockMvc.perform(post("/api/tts/synthesize")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("audio/mpeg"))
                .andExpect(content().bytes(mockAudioBytes));
    }

    @Test
    @DisplayName("Synthesize API returns 400 when text is too long")
    void synthesizeAPI_TextTooLong_Returns400() throws Exception {
        // Given text longer than 400 characters
        String longText = "a".repeat(401);
        when(ttsProperties.getVoiceByCharacter()).thenReturn(Map.of(
                "zet", "ko-KR-Neural2-c"
        ));
        String requestJson = """
                {
                  "text": "%s",
                  "character": "zet"
                }
                """.formatted(longText);

        // When & Then
        mockMvc.perform(post("/api/tts/synthesize")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isBadRequest());
    }
}
