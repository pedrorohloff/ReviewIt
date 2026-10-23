package com.pedrorohloff.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordConfig {

    @Bean
    public PasswordEncoder passwordEncoder(
            @Value("${app.auth.bcrypt-strength:12}") int strength) {
        if (strength < 4 || strength > 31) {
            throw new IllegalArgumentException("app.auth.bcrypt-strength must be between 4 and 31");
        }
        return new BCryptPasswordEncoder(strength);
    }
}
