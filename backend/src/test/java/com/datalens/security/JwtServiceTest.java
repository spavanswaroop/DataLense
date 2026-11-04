package com.datalens.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails testUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86400000L);

        testUser = new User("developer@datalens.com", "password123", Collections.emptyList());
    }

    @Test
    void testGenerateTokenAndExtractUsername() {
        String token = jwtService.generateToken(testUser);
        assertNotNull(token);
        assertFalse(token.isEmpty());

        String extractedUsername = jwtService.extractUsername(token);
        assertEquals("developer@datalens.com", extractedUsername);
    }

    @Test
    void testIsTokenValid() {
        String token = jwtService.generateToken(testUser);
        boolean isValid = jwtService.isTokenValid(token, testUser);
        assertTrue(isValid);
    }

    @Test
    void testTokenInvalidForDifferentUser() {
        String token = jwtService.generateToken(testUser);
        UserDetails anotherUser = new User("hacker@other.com", "password", Collections.emptyList());
        boolean isValid = jwtService.isTokenValid(token, anotherUser);
        assertFalse(isValid);
    }
}

