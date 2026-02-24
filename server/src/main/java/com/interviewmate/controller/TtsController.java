package com.interviewmate.controller;

import com.interviewmate.application.port.out.TtsPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.DigestUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/tts")
@RequiredArgsConstructor
public class TtsController {

    private final TtsPort ttsPort;

    record TtsRequest(String text, String character, String format, Double speakingRate) {}

    @PostMapping(value = "/synthesize", produces = "audio/mpeg")
    @Cacheable(value = "ttsCache", key = "#request.character + '_' + T(org.springframework.util.DigestUtils).md5DigestAsHex(#request.text.trim().replaceAll('\\\\s+', ' ').getBytes())")
    public ResponseEntity<byte[]> synthesize(@RequestBody TtsRequest request) {
        if (request.text() == null || request.text().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        // MVP: Limit text length to 400 as per GPT instructions
        if (request.text().length() > 400) {
            log.warn("Text length exceeds 400 characters: {}", request.text().length());
            return ResponseEntity.badRequest().build();
        }

        String format = request.format() != null ? request.format() : "mp3";
        Double speakingRate = request.speakingRate() != null ? request.speakingRate() : 1.0;
        
        // Resolve voice name (defaulting to zet if not recognized for fallback)
        String voiceName = "ko-KR-Neural2-c"; // default male
        if ("luna".equalsIgnoreCase(request.character())) {
            voiceName = "ko-KR-Neural2-b"; // female
        } else if ("iron".equalsIgnoreCase(request.character())) {
            voiceName = "ko-KR-Neural2-d"; // authoritative male
        } else if (request.character() != null && request.character().startsWith("ko-KR")) {
            // direct voice passing for tests/flexibility
            voiceName = request.character();
        }

        byte[] audioBytes = ttsPort.synthesize(request.text(), voiceName, format, speakingRate);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/mpeg"))
                .body(audioBytes);
    }
}
