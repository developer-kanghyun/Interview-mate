package com.interviewmate.application.ai.port;

public interface AiChatCompletionPort {
    String requestSingleResponse(String systemPrompt, String userPrompt);
}
