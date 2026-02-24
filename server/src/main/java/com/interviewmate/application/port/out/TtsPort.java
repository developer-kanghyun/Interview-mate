package com.interviewmate.application.port.out;

public interface TtsPort {
    byte[] synthesize(String text, String character, String format, Double speakingRate);
}
