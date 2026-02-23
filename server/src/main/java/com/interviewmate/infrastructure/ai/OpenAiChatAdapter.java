package com.interviewmate.infrastructure.ai;

import com.interviewmate.application.ai.port.AiChatPort;
import com.interviewmate.dto.openai.OpenAiMessage;
import com.interviewmate.service.OpenAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class OpenAiChatAdapter implements AiChatPort {

    private final OpenAiService openAiService;

    @Override
    public String requestSingleResponse(String systemPrompt, String userPrompt) {
        List<OpenAiMessage> messages = List.of(
                new OpenAiMessage("system", systemPrompt),
                new OpenAiMessage("user", userPrompt)
        );
        return openAiService.createChatCompletion(messages);
    }
}
