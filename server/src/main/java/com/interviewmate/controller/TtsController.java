package com.interviewmate.controller;

import com.interviewmate.application.port.out.TtsPort;
import com.interviewmate.global.config.TtsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;

@Slf4j
@RestController
@RequestMapping("/api/tts")
@RequiredArgsConstructor
public class TtsController {

    private static final int MAX_TEXT_LENGTH = 400;
    private static final String DEFAULT_VOICE_NAME = "ko-KR-Neural2-c";

    private final TtsPort ttsPort;
    private final TtsProperties ttsProperties;

    record TtsRequest(String text, String character, String format, Double speakingRate) {}

    @PostMapping(value = "/synthesize", produces = "audio/mpeg")
    @Cacheable(
            value = "ttsCache",
            key = "#root.target.resolveVoiceName(#request.character) + '_' + " +
                    "T(org.springframework.util.DigestUtils).md5DigestAsHex(#root.target.normalizeText(#request.text).getBytes()) + '_' + " +
                    "#root.target.resolveSpeakingRate(#request.speakingRate)"
    )
    public ResponseEntity<byte[]> synthesize(@RequestBody TtsRequest request) {
        if (request.text() == null || request.text().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String normalizedText = normalizeText(request.text());
        if (normalizedText.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // MVP: Limit text length to 400
        if (normalizedText.length() > MAX_TEXT_LENGTH) {
            log.warn("Text length exceeds {} characters: {}", MAX_TEXT_LENGTH, normalizedText.length());
            return ResponseEntity.badRequest().build();
        }

        String format = request.format() != null ? request.format() : "mp3";
        Double speakingRate = resolveSpeakingRate(request.speakingRate());
        String voiceName = resolveVoiceName(request.character());

        byte[] audioBytes = ttsPort.synthesize(normalizedText, voiceName, format, speakingRate);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/mpeg"))
                .body(audioBytes);
    }

    public String normalizeText(String text) {
        return text == null ? "" : text.trim().replaceAll("\\\\s+", " ");
    }

    public Double resolveSpeakingRate(Double speakingRate) {
        return speakingRate != null ? speakingRate : 1.0;
    }

    public String resolveVoiceName(String character) {
        if (character == null || character.isBlank()) {
            return voiceByCharacterOrDefault("zet");
        }

        if (character.startsWith("ko-KR")) {
            return character;
        }

        return voiceByCharacterOrDefault(character.toLowerCase(Locale.ROOT));
    }

    private String voiceByCharacterOrDefault(String characterKey) {
        return ttsProperties.getVoiceByCharacter().getOrDefault(characterKey, DEFAULT_VOICE_NAME);
    }
}
