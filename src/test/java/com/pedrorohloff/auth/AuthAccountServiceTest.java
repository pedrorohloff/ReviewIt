package com.pedrorohloff.auth;

import com.nimbusds.jwt.SignedJWT;
import com.pedrorohloff.AbstractIntegrationTest;
import com.pedrorohloff.TestDataFactory;
import com.pedrorohloff.auth.dto.AuthResponseDTO;
import com.pedrorohloff.auth.dto.LoginRequestDTO;
import com.pedrorohloff.auth.dto.RegisterRequestDTO;
import com.pedrorohloff.exception.BusinessException;
import com.pedrorohloff.exception.ForbiddenException;
import com.pedrorohloff.exception.UnauthorizedException;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import com.pedrorohloff.profile.enums.AccountStatus;
import com.pedrorohloff.profile.enums.Role;
import com.pedrorohloff.security.AppJwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class AuthAccountServiceTest extends AbstractIntegrationTest {

    @Autowired
    private AuthAccountService authAccountService;

    @Autowired
    private AppCredentialRepository credentialRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AppJwtService appJwtService;

    @Test
    void shouldRegisterAProfileAndCredential() throws Exception {
        AuthResponseDTO result = authAccountService.register(
                new RegisterRequestDTO("newreader", "Reader@Example.com", "Password123!"));

        assertNotNull(result.accessToken());
        assertEquals("Bearer", result.tokenType());
        assertEquals("reader@example.com", result.email());
        assertEquals("newreader", result.profile().username());
        assertEquals("Regular", result.profile().role());
        assertEquals("Active", result.profile().status());
        assertTrue(result.profile().onboarded());

        Profile profile = profileRepository.findById(result.profile().id()).orElseThrow();
        assertEquals("newreader", profile.getUsername());
        assertTrue(profile.isOnboarded());

        AppCredential credential = credentialRepository
                .findByEmail("reader@example.com")
                .orElseThrow();
        assertEquals(profile.getId(), credential.getProfileId());
        assertNotEquals("Password123!", credential.getPasswordHash());
        assertTrue(passwordEncoder.matches("Password123!", credential.getPasswordHash()));

        SignedJWT jwt = SignedJWT.parse(result.accessToken());
        assertEquals(profile.getId(), appJwtService.validate(jwt));
    }

    @Test
    void shouldLoginWithACaseInsensitiveEmail() {
        authAccountService.register(
                new RegisterRequestDTO("caseuser", "CaseUser@Example.com", "Password123!"));

        AuthResponseDTO result = authAccountService.login(
                new LoginRequestDTO("caseuser@example.com", "Password123!"));

        assertEquals("caseuser@example.com", result.email());
        assertEquals("caseuser", result.profile().username());
    }

    @Test
    void shouldRejectADuplicateEmailIgnoringCase() {
        authAccountService.register(
                new RegisterRequestDTO("firstreader", "reader@example.com", "Password123!"));

        assertThrows(
                BusinessException.class,
                () -> authAccountService.register(
                        new RegisterRequestDTO("secondreader", "READER@example.com", "Password123!")));
    }

    @Test
    void shouldRejectADuplicateUsernameIgnoringCase() {
        authAccountService.register(
                new RegisterRequestDTO("UniqueReader", "first@example.com", "Password123!"));

        assertThrows(
                BusinessException.class,
                () -> authAccountService.register(
                        new RegisterRequestDTO("uniquereader", "second@example.com", "Password123!")));
    }

    @Test
    void shouldRejectAReusedUsernameStoredByAnotherFlow() {
        profileRepository.save(TestDataFactory.createProfile("magiclinkuser"));

        assertThrows(
                BusinessException.class,
                () -> authAccountService.register(
                        new RegisterRequestDTO("MagicLinkUser", "new@example.com", "Password123!")));
    }

    @Test
    void shouldRejectAWrongPassword() {
        authAccountService.register(
                new RegisterRequestDTO("wrongpass", "wrong@example.com", "Password123!"));

        assertThrows(
                UnauthorizedException.class,
                () -> authAccountService.login(
                        new LoginRequestDTO("wrong@example.com", "NotThePassword!")));
    }

    @Test
    void shouldRejectAnUnknownEmail() {
        assertThrows(
                UnauthorizedException.class,
                () -> authAccountService.login(
                        new LoginRequestDTO("missing@example.com", "Password123!")));
    }

    @Test
    void shouldRejectAnInactiveAccount() {
        Profile profile = TestDataFactory.createProfile(
                "suspendedlogin",
                Role.REGULAR,
                AccountStatus.SUSPENDED,
                Instant.now().plusSeconds(3600));
        profileRepository.save(profile);

        AppCredential credential = new AppCredential();
        credential.setProfileId(profile.getId());
        credential.setEmail("suspended@example.com");
        credential.setPasswordHash(passwordEncoder.encode("Password123!"));
        credentialRepository.save(credential);

        assertThrows(
                ForbiddenException.class,
                () -> authAccountService.login(
                        new LoginRequestDTO("suspended@example.com", "Password123!")));
    }

    @Test
    void shouldRejectAPasswordLongerThanBcryptSupports() {
        String tooManyBytes = "á".repeat(40); // 40 characters, 80 UTF-8 bytes

        assertThrows(
                IllegalArgumentException.class,
                () -> authAccountService.register(
                        new RegisterRequestDTO("longpassword", "long@example.com", tooManyBytes)));
    }

    @Test
    void shouldTrimUsernameWhitespace() {
        AuthResponseDTO result = authAccountService.register(
                new RegisterRequestDTO("  trimmed  ", "trimmed@example.com", "Password123!"));

        assertEquals("trimmed", result.profile().username());
        assertTrue(profileRepository.existsByUsernameIgnoreCase("trimmed"));
    }

    @Test
    void shouldIssueADifferentTokenForEachLogin() throws Exception {
        authAccountService.register(
                new RegisterRequestDTO("twologins", "two@example.com", "Password123!"));

        String first = authAccountService.login(
                new LoginRequestDTO("two@example.com", "Password123!")).accessToken();
        String second = authAccountService.login(
                new LoginRequestDTO("two@example.com", "Password123!")).accessToken();

        assertNotEquals(first, second);
        assertEquals(
                SignedJWT.parse(first).getJWTClaimsSet().getSubject(),
                SignedJWT.parse(second).getJWTClaimsSet().getSubject());
    }
}
