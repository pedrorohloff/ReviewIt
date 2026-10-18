package com.pedrorohloff;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@ActiveProfiles("test")
@Transactional
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@SpringBootTest
@Testcontainers
public abstract class AbstractIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);

        // Build the schema from the JPA entities in the throwaway container.
        // The application runs against Supabase with ddl-auto=none, so without
        // this every repository call would fail with "relation does not exist".
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");

        // JwtFilter requires these @Value properties; provide throwaway values so
        // the context starts without a local .env.properties file.
        registry.add("supabase.jwt.jwks-url", () -> "https://example.invalid/jwks");
        registry.add("supabase.jwt.issuer", () -> "https://example.invalid/auth/v1");
    }
}
