package com.wareopt.backend.backend.api;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Component
public class SimpleAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();

        // Allow preflight OPTIONS requests unconditionally
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Whitelist public endpoints
        if (path.startsWith("/api/auth/login") || path.startsWith("/api/health") || path.startsWith("/error")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Only protect /api routes
        if (!path.startsWith("/api")) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean isAuthenticated = false;
        Cookie[] cookies = request.getCookies();
        
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("session_token".equals(cookie.getName()) && SimpleAuthController.SESSION_TOKEN.equals(cookie.getValue())) {
                    isAuthenticated = true;
                    break;
                }
            }
        }

        if (isAuthenticated) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Unauthorized");
        }
    }
}
