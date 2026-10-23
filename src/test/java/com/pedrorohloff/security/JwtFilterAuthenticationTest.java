package com.pedrorohloff.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtFilterAuthenticationTest {

    private static final String SECRET = "test-only-app-jwt-secret-with-at-least-32-bytes";

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatesAValidApplicationToken() throws Exception {
        AppJwtService appJwtService = new AppJwtService(SECRET, "reviewit-api", 3600);
        JwtFilter filter = new JwtFilter(appJwtService);
        UUID profileId = UUID.randomUUID();
        String token = appJwtService.issue(profileId, "reader@example.com").value();

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/posts");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(request.getAttribute("currentUserId")).isEqualTo(profileId);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
                .isEqualTo(profileId);
    }

    @Test
    void rejectsAnInvalidBearerToken() throws Exception {
        AppJwtService appJwtService = new AppJwtService(SECRET, "reviewit-api", 3600);
        JwtFilter filter = new JwtFilter(appJwtService);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/posts");
        request.addHeader("Authorization", "Bearer not-a-jwt");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(request.getAttribute("currentUserId")).isNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void leavesAnonymousRequestsAlone() throws Exception {
        AppJwtService appJwtService = new AppJwtService(SECRET, "reviewit-api", 3600);
        JwtFilter filter = new JwtFilter(appJwtService);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/posts");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(request.getAttribute("currentUserId")).isNull();
    }
}
