package com.interviewmate.service;

import com.interviewmate.dto.response.AuthMeResponse;
import com.interviewmate.entity.User;
import com.interviewmate.global.error.AppException;
import com.interviewmate.global.error.ErrorCode;
import com.interviewmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthUserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public AuthMeResponse getMyProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZED, "유효하지 않은 사용자입니다."));

        return AuthMeResponse.builder()
                .userId(String.valueOf(user.getId()))
                .email(user.getEmail())
                .name(user.getName())
                .build();
    }
}
