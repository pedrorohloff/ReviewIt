package com.pedrorohloff;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
        "app.jwt.secret=test-only-app-jwt-secret-with-at-least-32-bytes",
        "app.jwt.issuer=reviewit-api",
        "app.auth.bcrypt-strength=4"
})
class ReviewItApplicationTests {

    @Test
    void contextLoads() {
    }

}
