package com.interviewmate.service;

import com.interviewmate.dto.response.GoogleAuthLoginResponse;
import com.interviewmate.entity.User;
import com.interviewmate.conversation.repository.ConversationRepository;
import com.interviewmate.global.error.AppException;
import com.interviewmate.global.error.ErrorCode;
import com.interviewmate.repository.InterviewSessionRepository;
import com.interviewmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoogleAuthCallbackService {

    private final GoogleOAuthClient googleOAuthClient;
    private final GoogleOAuthStateService googleOAuthStateService;
    private final UserRepository userRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final ConversationRepository conversationRepository;

    @Transactional
    public GoogleAuthLoginResponse loginWithGoogleCode(String code, String state) {
        return loginWithGoogleCode(code, state, null);
    }

    @Transactional
    public GoogleAuthLoginResponse loginWithGoogleCode(String code, String state, String guestApiKey) {
        if (code == null || code.isBlank()) {
            throw new AppException(ErrorCode.INVALID_INPUT, "Google 인증 code가 필요합니다.");
        }
        if (!googleOAuthStateService.isValidState(state)) {
            throw new AppException(ErrorCode.INVALID_INPUT, "유효하지 않은 state입니다.");
        }

        String accessToken = googleOAuthClient.exchangeCodeForAccessToken(code);
        if (accessToken == null || accessToken.isBlank()) {
            throw new AppException(ErrorCode.INVALID_INPUT, "Google access token 교환에 실패했습니다.");
        }

        GoogleOAuthClient.GoogleUserInfo userInfo = googleOAuthClient.getUserInfo(accessToken);
        if (userInfo == null || userInfo.getSub() == null || userInfo.getSub().isBlank()) {
            throw new AppException(ErrorCode.INVALID_INPUT, "Google 사용자 정보 조회에 실패했습니다.");
        }

        User existingGoogleUser = userRepository.findByGoogleSub(userInfo.getSub()).orElse(null);
        User guestUser = findGuestUser(guestApiKey);

        boolean isNewUser = existingGoogleUser == null && guestUser == null;
        User authenticatedUser;

        if (existingGoogleUser != null) {
            authenticatedUser = existingGoogleUser;
            if (guestUser != null && !guestUser.getId().equals(existingGoogleUser.getId())) {
                mergeGuestDataIntoMember(guestUser, existingGoogleUser);
            }
        } else if (guestUser != null) {
            authenticatedUser = guestUser;
        } else {
            authenticatedUser = new User();
            authenticatedUser.setApiKey(generateApiKey());
        }

        authenticatedUser.setGoogleSub(userInfo.getSub());
        authenticatedUser.setEmail(userInfo.getEmail());
        authenticatedUser.setName(userInfo.getName());
        authenticatedUser.setIsGuest(false);
        User savedUser = userRepository.save(authenticatedUser);

        return GoogleAuthLoginResponse.builder()
                .apiKey(savedUser.getApiKey())
                .userId(String.valueOf(savedUser.getId()))
                .email(savedUser.getEmail())
                .name(savedUser.getName())
                .newUser(isNewUser)
                .build();
    }

    private User findGuestUser(String guestApiKey) {
        if (guestApiKey == null || guestApiKey.isBlank()) {
            return null;
        }

        User guestUser = userRepository.findByApiKey(guestApiKey).orElse(null);
        if (guestUser == null || !guestUser.isGuestUser()) {
            return null;
        }
        return guestUser;
    }

    private void mergeGuestDataIntoMember(User guestUser, User memberUser) {
        conversationRepository.reassignUserConversations(guestUser.getId(), memberUser.getId());
        interviewSessionRepository.reassignUserSessions(guestUser.getId(), memberUser.getId());
        userRepository.delete(guestUser);
    }

    private String generateApiKey() {
        return "im_" + UUID.randomUUID().toString().replace("-", "");
    }
}
