package com.interviewmate.infrastructure.ai;

import com.interviewmate.application.ai.port.AiChatCompletionPort;
import com.interviewmate.application.ai.port.AiChatPort;
import com.interviewmate.application.ai.port.AiChatStreamPort;
import com.interviewmate.dto.openai.OpenAiMessage;
import com.interviewmate.service.OpenAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;

@Component
@RequiredArgsConstructor
public class OpenAiChatAdapter implements AiChatPort, AiChatCompletionPort, AiChatStreamPort {

    private final OpenAiService openAiService;

    @Override
    public String requestSingleResponse(String systemPrompt, String userPrompt) {
        List<OpenAiMessage> messages = List.of(
                new OpenAiMessage("system", systemPrompt),
                new OpenAiMessage("user", userPrompt)
        );
        return openAiService.createChatCompletion(messages);
    }

    @Override
    public Flux<String> requestStream(List<OpenAiMessage> messages) {
        return openAiService.createChatCompletionStream(messages);
    }
}
