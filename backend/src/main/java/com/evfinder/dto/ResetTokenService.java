package com.evfinder.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Issues a short-lived token after a phone number's OTP has been verified,
 * so /reset-password can't be called without having passed /verify-otp first.
 *
 * This is in-memory only (fine for a single-instance app / student project).
 * If you deploy multiple backend instances behind a load balancer, move this
 * to a shared store like Redis or a database table instead.
 */
@Service
public class ResetTokenService {

    private static final long TOKEN_VALID_MINUTES = 5;

    private static class TokenInfo {
        String phone;
        Instant expiresAt;
    }

    private final Map<String, TokenInfo> tokens = new ConcurrentHashMap<>();

    public String issueToken(String phone) {
        String token = UUID.randomUUID().toString();
        TokenInfo info = new TokenInfo();
        info.phone = phone;
        info.expiresAt = Instant.now().plusSeconds(TOKEN_VALID_MINUTES * 60);
        tokens.put(token, info);
        return token;
    }

    /**
     * Checks the token is valid, not expired, and matches the given phone.
     * Consumes (removes) the token either way so it can't be reused.
     */
    public boolean consumeToken(String phone, String token) {
        TokenInfo info = tokens.remove(token);
        if (info == null) {
            return false;
        }
        if (Instant.now().isAfter(info.expiresAt)) {
            return false;
        }
        return info.phone.equals(phone);
    }
}
