package com.pedrorohloff.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;

import static org.assertj.core.api.Assertions.assertThat;

class CorsConfigTest {

    @Test
    void buildsConfigurationFromCommaSeparatedOrigins() {
        var source = CorsConfig.buildSource(
                "https://reviewit.vercel.app, http://localhost:5173,https://*.vercel.app");

        CorsConfiguration configuration = source.getCorsConfiguration(
                new MockHttpServletRequest("OPTIONS", "/api/v1/posts"));

        assertThat(configuration).isNotNull();
        assertThat(configuration.getAllowedOriginPatterns()).containsExactly(
                "https://reviewit.vercel.app",
                "http://localhost:5173",
                "https://*.vercel.app");
        assertThat(configuration.getAllowedMethods()).contains(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
        assertThat(configuration.getAllowedHeaders()).contains("Authorization", "Content-Type");
        assertThat(configuration.getAllowCredentials()).isFalse();
        assertThat(configuration.getMaxAge()).isEqualTo(3600L);
    }

    @Test
    void fallsBackToTheLocalDevOriginWhenTheListIsEmpty() {
        var source = CorsConfig.buildSource("  ,  ");

        CorsConfiguration configuration = source.getCorsConfiguration(
                new MockHttpServletRequest("GET", "/api/v1/posts"));

        assertThat(configuration).isNotNull();
        assertThat(configuration.getAllowedOriginPatterns()).containsExactly("http://localhost:5173");
    }
}
