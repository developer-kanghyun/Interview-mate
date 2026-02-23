package com.interviewmate.service;

import com.interviewmate.conversation.repository.ConversationRepository;
import com.interviewmate.dto.response.GoogleAuthLoginResponse;
import com.interviewmate.entity.User;
import com.interviewmate.repository.InterviewSessionRepository;
import com.interviewmate.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GoogleAuthCallbackServiceTest {

    @Mock
    private GoogleOAuthClient googleOAuthClient;

    @Mock
    private GoogleOAuthStateService googleOAuthStateService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InterviewSessionRepository interviewSessionRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @InjectMocks
    private GoogleAuthCallbackService googleAuthCallbackService;

    @Test
    void testLoginWithGuestApiKeyPromotesGuestUserToMember() {
        User guestUser = new User();
        guestUser.setId(10L);
        guestUser.setApiKey("guest-key");
        guestUser.setIsGuest(true);
        guestUser.setName("Guest User");

        GoogleOAuthClient.GoogleUserInfo userInfo = GoogleOAuthClient.GoogleUserInfo.builder()
                .sub("google-sub-1")
                .email("guestupgraded@example.com")
                .name("Upgraded Member")
                .build();

        when(googleOAuthStateService.isValidState("state-1")).thenReturn(true);
        when(googleOAuthClient.exchangeCodeForAccessToken("code-1")).thenReturn("access-token");
        when(googleOAuthClient.getUserInfo("access-token")).thenReturn(userInfo);
        when(userRepository.findByGoogleSub("google-sub-1")).thenReturn(Optional.empty());
        when(userRepository.findByApiKey("guest-key")).thenReturn(Optional.of(guestUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GoogleAuthLoginResponse response = googleAuthCallbackService.loginWithGoogleCode("code-1", "state-1", "guest-key");

        assertThat(response.isNewUser()).isFalse();
        assertThat(response.getUserId()).isEqualTo("10");
        assertThat(response.getApiKey()).isEqualTo("guest-key");
        assertThat(response.getEmail()).isEqualTo("guestupgraded@example.com");
        assertThat(response.getName()).isEqualTo("Upgraded Member");

        ArgumentCaptor<User> savedUserCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUserCaptor.capture());
        User savedUser = savedUserCaptor.getValue();
        assertThat(savedUser.isGuestUser()).isFalse();
        assertThat(savedUser.getGoogleSub()).isEqualTo("google-sub-1");
        assertThat(savedUser.getEmail()).isEqualTo("guestupgraded@example.com");

        verify(interviewSessionRepository, never()).reassignUserSessions(any(), any());
        verify(conversationRepository, never()).reassignUserConversations(any(), any());
    }

    @Test
    void testLoginWithGuestApiKeyMergesGuestDataIntoExistingMember() {
        User memberUser = new User();
        memberUser.setId(1L);
        memberUser.setApiKey("member-key");
        memberUser.setGoogleSub("google-sub-1");
        memberUser.setIsGuest(false);

        User guestUser = new User();
        guestUser.setId(2L);
        guestUser.setApiKey("guest-key");
        guestUser.setIsGuest(true);

        GoogleOAuthClient.GoogleUserInfo userInfo = GoogleOAuthClient.GoogleUserInfo.builder()
                .sub("google-sub-1")
                .email("member@example.com")
                .name("Member")
                .build();

        when(googleOAuthStateService.isValidState("state-1")).thenReturn(true);
        when(googleOAuthClient.exchangeCodeForAccessToken("code-1")).thenReturn("access-token");
        when(googleOAuthClient.getUserInfo("access-token")).thenReturn(userInfo);
        when(userRepository.findByGoogleSub("google-sub-1")).thenReturn(Optional.of(memberUser));
        when(userRepository.findByApiKey("guest-key")).thenReturn(Optional.of(guestUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GoogleAuthLoginResponse response = googleAuthCallbackService.loginWithGoogleCode("code-1", "state-1", "guest-key");

        assertThat(response.isNewUser()).isFalse();
        assertThat(response.getUserId()).isEqualTo("1");
        assertThat(response.getApiKey()).isEqualTo("member-key");
        assertThat(response.getEmail()).isEqualTo("member@example.com");

        verify(conversationRepository).reassignUserConversations(2L, 1L);
        verify(interviewSessionRepository).reassignUserSessions(2L, 1L);
        verify(userRepository).delete(guestUser);
    }
}
