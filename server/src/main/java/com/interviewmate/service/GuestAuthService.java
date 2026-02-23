package com.interviewmate.service;

import com.interviewmate.dto.response.GuestAuthResponse;
import com.interviewmate.entity.User;
import com.interviewmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GuestAuthService {

    private static final int TRIAL_QUESTION_LIMIT = 1;
    private final UserRepository userRepository;

    @Transactional
    public GuestAuthResponse issueGuestAccess() {
        User guestUser = new User();
        guestUser.setApiKey(generateGuestApiKey());
        guestUser.setIsGuest(true);
        guestUser.setName("Guest User");

        User savedUser = userRepository.save(guestUser);
        return GuestAuthResponse.builder()
                .apiKey(savedUser.getApiKey())
                .userId(String.valueOf(savedUser.getId()))
                .trialQuestionLimit(TRIAL_QUESTION_LIMIT)
                .build();
    }

    private String generateGuestApiKey() {
        return "im_guest_" + UUID.randomUUID().toString().replace("-", "");
    }
}
