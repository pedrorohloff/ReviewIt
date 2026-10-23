package com.pedrorohloff.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AppJwtServiceTest {

    private static final String SECRET = "test-only-app-jwt-secret-with-at-least-32-bytes";
    private static final String OTHER_SECRET = "another-test-app-jwt-secret-with-32-bytes!!";
    private static final String ISSUER = "reviewit-api";

    @Test
    void issuesAndValidatesAToken() throws Exception {
        AppJwtService service = new AppJwtService(SECRET, ISSUER, 3600);
        UUID profileId = UUID.randomUUID();
        Instant before = Instant.now();

        AppJwtService.IssuedToken issued = service.issue(profileId, "reader@example.com");

        SignedJWT parsed = SignedJWT.parse(issued.value());
        assertThat(parsed.getHeader().getAlgorithm()).isEqualTo(JWSAlgorithm.HS256);
        assertThat(parsed.getJWTClaimsSet().getIssuer()).isEqualTo(ISSUER);
        assertThat(parsed.getJWTClaimsSet().getSubject()).isEqualTo(profileId.toString());
        assertThat(parsed.getJWTClaimsSet().getStringClaim("email")).isEqualTo("reader@example.com");
        assertThat(issued.expiresAt()).isAfter(before);
        assertThat(service.validate(parsed)).isEqualTo(profileId);
    }

    @Test
    void rejectsATokenSignedWithAnotherSecret() throws Exception {
        AppJwtService issuerService = new AppJwtService(SECRET, ISSUER, 3600);
        AppJwtService verifierService = new AppJwtService(OTHER_SECRET, ISSUER, 3600);
        SignedJWT parsed = SignedJWT.parse(
                issuerService.issue(UUID.randomUUID(), "reader@example.com").value());

        assertThatThrownBy(() -> verifierService.validate(parsed))
                .isInstanceOf(JOSEException.class)
                .hasMessageContaining("signature");
    }

    @Test
    void rejectsATokenFromAnotherIssuer() throws Exception {
        AppJwtService issuerService = new AppJwtService(SECRET, "another-issuer", 3600);
        AppJwtService verifierService = new AppJwtService(SECRET, ISSUER, 3600);
        SignedJWT parsed = SignedJWT.parse(
                issuerService.issue(UUID.randomUUID(), "reader@example.com").value());

        assertThatThrownBy(() -> verifierService.validate(parsed))
                .isInstanceOf(JOSEException.class)
                .hasMessageContaining("issuer");
    }

    @Test
    void rejectsAnExpiredToken() throws Exception {
        AppJwtService service = new AppJwtService(SECRET, ISSUER, 3600);
        String token = signedToken(
                new JWTClaimsSet.Builder()
                        .subject(UUID.randomUUID().toString())
                        .issuer(ISSUER)
                        .expirationTime(Date.from(Instant.now().minusSeconds(120)))
                        .build());

        assertThatThrownBy(() -> service.validate(SignedJWT.parse(token)))
                .isInstanceOf(JOSEException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void rejectsATokenWithANonUuidSubject() throws Exception {
        AppJwtService service = new AppJwtService(SECRET, ISSUER, 3600);
        String token = signedToken(
                new JWTClaimsSet.Builder()
                        .subject("not-a-uuid")
                        .issuer(ISSUER)
                        .expirationTime(Date.from(Instant.now().plusSeconds(3600)))
                        .build());

        assertThatThrownBy(() -> service.validate(SignedJWT.parse(token)))
                .isInstanceOf(JOSEException.class)
                .hasMessageContaining("UUID");
    }

    @Test
    void rejectsASecretShorterThan256Bits() {
        assertThatThrownBy(() -> new AppJwtService("too-short", ISSUER, 3600))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 bytes");
    }

    private String signedToken(JWTClaimsSet claims) throws JOSEException {
        SignedJWT jwt = new SignedJWT(
                new JWSHeader(JWSAlgorithm.HS256),
                claims);
        jwt.sign(new MACSigner(SECRET));
        return jwt.serialize();
    }
}
