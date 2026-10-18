package com.pedrorohloff.shared.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "ReviewIt API",
                version = "v1",
                description = "ReviewIt - Platform for book, movie, album, series and game reviews. " +
                        "API based on crud-angular-spring pattern. Authentication uses Supabase JWT.",
                contact = @Contact(
                        name = "Pedro Rohloff",
                        url = "https://github.com/pedrorohloff/ReviewIt"
                )
        ),
        servers = {
                @Server(url = "http://localhost:8080", description = "Local Development")
        },
        security = @SecurityRequirement(name = "bearerAuth")
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Supabase JWT token. Provide the access token as: Bearer <token>"
)
public class OpenApiConfig {
}