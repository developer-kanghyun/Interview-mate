package com.interviewmate.application.ai.usecase;

import com.interviewmate.application.ai.port.AiChatCompletionPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerateModelAnswerUseCase {

    private final AiChatCompletionPort aiChatPort;

    public String execute(String jobRole, String question) {
        String systemPrompt = "당신은 시니어 기술 면접관입니다. 질문에 대한 모범답안을 3~5문장으로 간결하게 작성하세요.";
        String userPrompt = String.format("직무: %s%n질문: %s%n요구사항: 핵심 개념, 근거, 실무 관점을 포함", jobRole, question);
        try {
            String generated = aiChatPort.requestSingleResponse(systemPrompt, userPrompt);
            if (generated == null || generated.isBlank()) {
                return fallbackModelAnswer(question);
            }
            return generated;
        } catch (Exception exception) {
            log.warn("모범답안 생성 실패, fallback 답안 사용: {}", exception.getMessage());
            return fallbackModelAnswer(question);
        }
    }

    private String fallbackModelAnswer(String question) {
        return "모범답안 예시: 질문의 핵심 개념을 먼저 정의하고, 선택한 방식의 근거를 설명한 뒤, 실무에서의 트레이드오프와 적용 사례를 함께 제시하세요. 질문: " + question;
    }
}
