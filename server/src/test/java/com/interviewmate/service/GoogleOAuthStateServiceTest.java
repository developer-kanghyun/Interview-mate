package com.interviewmate.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class GoogleOAuthStateServiceTest {

    @Test
    void testGeneratedStateShouldBeValid() {
        GoogleOAuthStateService service = new GoogleOAuthStateService();
        ReflectionTestUtils.setField(service, "stateSecret", "test-secret");
        ReflectionTestUtils.setField(service, "stateTtlSeconds", 600L);

        String state = service.generateState();
        boolean valid = service.isValidState(state);

        assertThat(valid).isTrue();
    }

    @Test
    void testInvalidStateShouldReturnFalse() {
        GoogleOAuthStateService service = new GoogleOAuthStateService();
        ReflectionTestUtils.setField(service, "stateSecret", "test-secret");
        ReflectionTestUtils.setField(service, "stateTtlSeconds", 600L);

        boolean valid = service.isValidState("invalid-state");

        assertThat(valid).isFalse();
    }
}
