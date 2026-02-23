package com.interviewmate.service;

import com.interviewmate.entity.User;
import com.interviewmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("local")
@RequiredArgsConstructor
public class LocalDevUserSeedService implements CommandLineRunner {

    private static final String LOCAL_SMOKE_API_KEY = "test-key";
    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        if (userRepository.findByApiKey(LOCAL_SMOKE_API_KEY).isPresent()) {
            return;
        }

        User localUser = new User();
        localUser.setApiKey(LOCAL_SMOKE_API_KEY);
        localUser.setName("Local Smoke User");
        localUser.setEmail("local-smoke@interviewmate.dev");
        localUser.setIsGuest(false);
        userRepository.save(localUser);
        log.info("로컬 스모크 사용자 생성: apiKey={}", LOCAL_SMOKE_API_KEY);
    }
}
