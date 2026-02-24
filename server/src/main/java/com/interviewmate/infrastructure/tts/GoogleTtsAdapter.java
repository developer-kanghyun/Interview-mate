package com.interviewmate.infrastructure.tts;

import com.interviewmate.application.port.out.TtsPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Component
public class GoogleTtsAdapter implements TtsPort {

    private final WebClient webClient;
    private final String apiKey;

    public GoogleTtsAdapter(WebClient.Builder webClientBuilder,
                            @Value("${tts.google.api-key}") String apiKey) {
        this.webClient = webClientBuilder
                .baseUrl("https://texttospeech.googleapis.com")
                .build();
        this.apiKey = apiKey;
    }

    // Overloaded constructor for tests
    GoogleTtsAdapter(WebClient webClient, String apiKey) {
        this.webClient = webClient;
        this.apiKey = apiKey;
    }

    @Override
    public byte[] synthesize(String text, String character, String format, Double speakingRate) {
        Map<String, Object> requestBody = Map.of(
                "input", Map.of("text", text),
                "voice", Map.of(
                        "languageCode", "ko-KR",
                        "name", character
                ),
                "audioConfig", Map.of(
                        "audioEncoding", "MP3",
                        "speakingRate", speakingRate != null ? speakingRate : 1.0
                )
        );

        log.debug("Calling Google TTS for text: [{}], voice: [{}]", text, character);

        Map<String, String> response = webClient.post()
                .uri(builder -> builder
                        .path("/v1/text:synthesize")
                        .queryParam("key", apiKey)
                        .build())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, String>>() {})
                .timeout(Duration.ofSeconds(5))
                .retryWhen(Retry.backoff(1, Duration.ofMillis(500)))
                .block();

        if (response == null || !response.containsKey("audioContent")) {
            throw new RuntimeException("Google TTS API did not return audioContent");
        }

        String audioContentBase64 = response.get("audioContent");
        return Base64.getDecoder().decode(audioContentBase64);
    }
}
