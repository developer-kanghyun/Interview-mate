package com.interviewmate.application.ai.port;

import com.interviewmate.dto.openai.OpenAiMessage;
import reactor.core.publisher.Flux;

import java.util.List;

public interface AiChatStreamPort {
    Flux<String> requestStream(List<OpenAiMessage> messages);
}
