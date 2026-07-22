package com.wareopt.backend.backend.api;

import com.wareopt.backend.backend.api.dto.LoginRequest;
import com.wareopt.backend.backend.api.dto.LoginResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class SimpleAuthController {

    @Value("${APP_USERNAME:admin}")
    private String appUsername;

    @Value("${APP_PASSWORD:password}")
    private String appPassword;

    // A simple in-memory session token that resets on restart
    public static final String SESSION_TOKEN = UUID.randomUUID().toString();

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        if (appUsername.equals(request.getUsername()) && appPassword.equals(request.getPassword())) {
            
            Cookie cookie = new Cookie("session_token", SESSION_TOKEN);
            cookie.setHttpOnly(true);
            cookie.setSecure(true);
            cookie.setPath("/");
            cookie.setMaxAge(24 * 60 * 60); // 1 day
            // We use header directly to support SameSite=None since javax.servlet.http.Cookie doesn't have it natively in older servlet APIs
            response.addHeader("Set-Cookie", "session_token=" + SESSION_TOKEN + "; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=86400");
            
            return ResponseEntity.ok(new LoginResponse("Login successful"));
        }
        
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        response.addHeader("Set-Cookie", "session_token=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0");
        return ResponseEntity.ok().build();
    }
}
