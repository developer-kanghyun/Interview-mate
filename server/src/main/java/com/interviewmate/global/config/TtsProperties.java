package com.interviewmate.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "tts")
public class TtsProperties {

    private String provider = "GOOGLE";

    private Map<String, String> voiceByCharacter = new LinkedHashMap<>(Map.of(
            "zet", "ko-KR-Neural2-c",
            "luna", "ko-KR-Neural2-b",
            "iron", "ko-KR-Neural2-d"
    ));
}
