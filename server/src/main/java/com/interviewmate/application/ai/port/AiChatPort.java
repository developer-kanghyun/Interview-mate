package com.interviewmate.application.ai.port;

public interface AiChatPort {
    String requestSingleResponse(String systemPrompt, String userPrompt);
}
