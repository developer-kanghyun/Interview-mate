package com.interviewmate.service;

import com.interviewmate.application.ai.port.AiChatCompletionPort;
import com.interviewmate.application.ai.port.AiChatStreamPort;
import com.interviewmate.dto.request.ChatCompletionRequest;
import com.interviewmate.dto.response.ChatCompletionResponse;
import com.interviewmate.dto.openai.OpenAiMessage;
import com.interviewmate.entity.Conversation;
import com.interviewmate.entity.Message;
import com.interviewmate.global.error.AppException;
import com.interviewmate.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationContextService conversationContextService;
    private final AiChatCompletionPort aiChatCompletionPort;
    private final AiChatStreamPort aiChatStreamPort;

    @Transactional
    public ChatCompletionResponse createChatCompletion(ChatCompletionRequest request, Long userId) {
        Long conversationId = parseConversationId(request.getConversationId());
        Conversation conversation = conversationContextService.getOrCreateConversation(conversationId, userId, request.getMessage());

        conversationContextService.saveUserMessage(conversation, request.getMessage());

        List<OpenAiMessage> openAiMessages =
                conversationContextService.buildOpenAiContextMessages(conversation.getId());

        String assistantContent = aiChatCompletionPort.requestCompletion(openAiMessages);

        Message assistantMessage = conversationContextService.saveAssistantMessage(conversation, assistantContent);

        return ChatCompletionResponse.builder()
                .conversationId(String.valueOf(conversation.getId()))
                .message(ChatCompletionResponse.MessageDto.builder()
                        .id(String.valueOf(assistantMessage.getId()))
                        .role(assistantMessage.getRole().name())
                        .content(assistantMessage.getContent())
                        .createdAt(assistantMessage.getCreatedAt())
                        .build())
                .build();
    }

    public SseEmitter createChatCompletionStream(ChatCompletionRequest request, Long userId) {
        SseEmitter emitter = new SseEmitter(60000L); 
        Long conversationId = parseConversationId(request.getConversationId());
        Conversation conversation = conversationContextService.getOrCreateConversation(conversationId, userId, request.getMessage());

        conversationContextService.saveUserMessage(conversation, request.getMessage());

        List<OpenAiMessage> openAiMessages =
                conversationContextService.buildOpenAiContextMessages(conversation.getId());

        StringBuilder gatheredContent = new StringBuilder();

        aiChatStreamPort.requestStream(openAiMessages)
                .subscribe(
                        content -> {
                            if (content != null) {
                                gatheredContent.append(content);
                                try {
                                    Object eventData = Collections.singletonMap("text", content);
                                    emitter.send(SseEmitter.event()
                                            .name("token")
                                            .data(eventData));
                                } catch (IOException e) {
                                    log.error("SSE send failed", e);
                                }
                            }
                        },
                        streamError -> {
                            log.error("Stream error", streamError);
                            emitter.completeWithError(streamError);
                        },
                        () -> {
                            try {
                                String fullContent = gatheredContent.toString();
                                if (!fullContent.isEmpty()) {
                                    conversationContextService.saveAssistantMessage(conversation, fullContent);
                                }

                                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                                emitter.complete();
                            } catch (Exception e) {
                                log.error("SSE complete failed", e);
                                emitter.completeWithError(e);
                            }
                        }
                );

        return emitter;
    }

    private Long parseConversationId(String id) {
        if (id == null || id.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(id);
        } catch (NumberFormatException e) {
            throw new AppException(ErrorCode.INVALID_INPUT, "conversation_id는 숫자여야 합니다.");
        }
    }
}
