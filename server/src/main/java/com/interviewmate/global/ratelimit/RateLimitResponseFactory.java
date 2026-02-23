package com.interviewmate.global.ratelimit;

import com.interviewmate.dto.common.ApiErrorResponse;
import org.springframework.stereotype.Component;

@Component
public class RateLimitResponseFactory {

    public static final String RATE_LIMIT_EXCEEDED_CODE = "RATE_LIMIT_EXCEEDED";

    public ApiErrorResponse createBody(RateLimitException exception) {
        return ApiErrorResponse.error(
                RATE_LIMIT_EXCEEDED_CODE,
                String.format("요청 횟수 제한 초과 (%d초 후 재시도)", exception.getRetryAfterSeconds())
        );
    }
}
