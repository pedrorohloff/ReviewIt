package com.pedrorohloff.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security configuration active only in the "test" profile.
 *
 * Controller integration tests simulate the current user by setting the
 * "currentUserId" request attribute directly (the same attribute the
 * {@link JwtFilter} would populate from a validated JWT). Real JWT validation
 * against Supabase cannot run in tests, so security simply permits all
 * requests while keeping the session stateless.
 */
@Profile("test")
@Configuration
@EnableWebSecurity
public class TestSecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

        return http.build();
    }
}
