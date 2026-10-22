package com.pedrorohloff.security;

import com.pedrorohloff.shared.controller.HealthController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = HealthController.class)
@Import({SecurityConfig.class, CorsConfig.class, JwtFilter.class})
@TestPropertySource(properties = {
        "app.cors.allowed-origins=https://app.example.com",
        "supabase.jwt.jwks-url=https://example.invalid/keys",
        "supabase.jwt.issuer=https://example.invalid/auth/v1"
})
class CorsSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void allowsPreflightFromAConfiguredOrigin() throws Exception {
        mockMvc.perform(options("/api/v1/posts")
                        .header(HttpHeaders.ORIGIN, "https://app.example.com")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://app.example.com"));
    }

    @Test
    void rejectsPreflightFromAnUnknownOrigin() throws Exception {
        mockMvc.perform(options("/api/v1/posts")
                        .header(HttpHeaders.ORIGIN, "https://evil.example.com")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isForbidden());
    }

    @Test
    void healthIsPublic() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk());
    }
}
