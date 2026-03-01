package com.interviewmate.application.ai.port;

import com.interviewmate.dto.openai.OpenAiMessage;

import java.util.List;

public interface AiChatCompletionPort {
    String requestSingleResponse(String systemPrompt, String userPrompt);

    String requestCompletion(List<OpenAiMessage> messages);
}
