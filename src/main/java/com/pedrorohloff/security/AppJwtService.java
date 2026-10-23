package com.pedrorohloff.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Issues and verifies the application's own JWTs for email/password sessions.
 *
 * <p>These tokens are intentionally separate from Supabase access tokens:
 * Supabase continues to own magic-link and OAuth users, while locally
 * registered users are authenticated by this service. Both token types are
 * accepted by {@link JwtFilter}.</p>
 */
@Service
public class AppJwtService {

    private static final int MIN_SECRET_BYTES = 32;
    private static final long CLOCK_SKEW_SECONDS = 30;

    private final MACSigner signer;
    private final MACVerifier verifier;
    private final String issuer;
    private final Duration ttl;

    public AppJwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.issuer:reviewit-api}") String issuer,
            @Value("${app.jwt.ttl-seconds:86400}") long ttlSeconds) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "app.jwt.secret must contain at least " + MIN_SECRET_BYTES + " bytes");
        }
        if (issuer == null || issuer.isBlank()) {
            throw new IllegalStateException("app.jwt.issuer must not be blank");
        }
        if (ttlSeconds <= 0) {
            throw new IllegalStateException("app.jwt.ttl-seconds must be positive");
        }

        try {
            this.signer = new MACSigner(secret);
            this.verifier = new MACVerifier(secret);
        } catch (JOSEException e) {
            throw new IllegalStateException("Unable to configure application JWT signing", e);
        }

        this.issuer = issuer;
        this.ttl = Duration.ofSeconds(ttlSeconds);
    }

    public IssuedToken issue(UUID profileId, String email) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(ttl);

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(profileId.toString())
                .issuer(issuer)
                .jwtID(UUID.randomUUID().toString())
                .issueTime(Date.from(issuedAt))
                .expirationTime(Date.from(expiresAt))
                .claim("email", email)
                .build();

        SignedJWT jwt = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.HS256)
                        .type(JOSEObjectType.JWT)
                        .build(),
                claims);

        try {
            jwt.sign(signer);
        } catch (JOSEException e) {
            throw new IllegalStateException("Unable to sign application JWT", e);
        }

        return new IssuedToken(jwt.serialize(), expiresAt);
    }

    public UUID validate(SignedJWT jwt) throws JOSEException, ParseException {
        if (!JWSAlgorithm.HS256.equals(jwt.getHeader().getAlgorithm())) {
            throw new JOSEException("Application JWTs must use HS256");
        }

        if (!jwt.verify(verifier)) {
            throw new JOSEException("Invalid JWT signature");
        }

        JWTClaimsSet claims = jwt.getJWTClaimsSet();

        if (!issuer.equals(claims.getIssuer())) {
            throw new JOSEException("Invalid JWT issuer");
        }

        Instant now = Instant.now();
        Date expiration = claims.getExpirationTime();
        if (expiration == null
                || expiration.toInstant().isBefore(now.minusSeconds(CLOCK_SKEW_SECONDS))) {
            throw new JOSEException("JWT has expired");
        }

        Date issuedAt = claims.getIssueTime();
        if (issuedAt != null && issuedAt.toInstant().isAfter(now.plusSeconds(CLOCK_SKEW_SECONDS))) {
            throw new JOSEException("JWT was issued in the future");
        }

        String subject = claims.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new JOSEException("JWT subject is missing");
        }

        try {
            return UUID.fromString(subject);
        } catch (IllegalArgumentException e) {
            throw new JOSEException("JWT subject is not a UUID", e);
        }
    }

    /**
     * Lets the filter choose the correct verifier before validating the token.
     * Reading the unverified issuer is safe here because the selected verifier
     * always checks the signature before the subject is trusted.
     */
    public boolean ownsIssuer(String candidateIssuer) {
        return issuer.equals(candidateIssuer);
    }

    public record IssuedToken(String value, Instant expiresAt) {
    }
}
