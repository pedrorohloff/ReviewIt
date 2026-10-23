package com.pedrorohloff.security;

import com.pedrorohloff.auth.AuthAccountService;
import com.pedrorohloff.auth.AuthController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@Import({SecurityConfig.class, CorsConfig.class, JwtFilter.class, AppJwtService.class})
@TestPropertySource(properties = {
        "app.cors.allowed-origins=https://app.example.com",
        "supabase.jwt.jwks-url=https://example.invalid/keys",
        "supabase.jwt.issuer=https://example.invalid/auth/v1",
        "app.jwt.secret=test-only-app-jwt-secret-with-at-least-32-bytes",
        "app.jwt.issuer=reviewit-api"
})
class AuthSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthAccountService authAccountService;

    @Test
    void registerIsPublic() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"securityuser","email":"security@example.com","password":"Password123!"}
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void loginIsPublic() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"security@example.com","password":"Password123!"}
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void otherEndpointsStillRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/posts"))
                .andExpect(status().isForbidden());
    }
}
