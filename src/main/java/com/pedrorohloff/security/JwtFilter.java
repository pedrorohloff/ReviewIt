package com.pedrorohloff.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.ECDSAVerifier;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.ECKey;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URL;
import java.security.interfaces.RSAPublicKey;
import java.text.ParseException;
import java.util.Collections;
import java.util.UUID;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Value("${supabase.jwt.jwks-url}")
    private String jwksUrl;

    @Value("${supabase.jwt.issuer}")
    private String issuer;

    private static final long JWKS_TTL_MS = 5 * 60 * 1000L;
    private static final long JWKS_FORCE_REFRESH_INTERVAL_MS = 30 * 1000L;

    private volatile JWKSet cachedJwks;
    private volatile long cachedAt;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                UUID currentUserId = validateToken(token);
                if (currentUserId != null) {
                    request.setAttribute("currentUserId", currentUserId);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    currentUserId,
                                    null,
                                    Collections.emptyList()
                            );
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception e) {
                SecurityContextHolder.clearContext();
                response.setStatus(HttpStatus.UNAUTHORIZED.value());
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private UUID validateToken(String token) throws Exception {
        SignedJWT signedJWT = SignedJWT.parse(token);

        String keyId = signedJWT.getHeader().getKeyID();
        JWK jwk = jwks().getKeyByKeyId(keyId);
        if (jwk == null
                && System.currentTimeMillis() - cachedAt > JWKS_FORCE_REFRESH_INTERVAL_MS) {
            // Supabase may have rotated signing keys. Throttle forced refreshes so
            // unauthenticated requests with random kids cannot hammer the JWKS URL.
            jwk = refreshJwks().getKeyByKeyId(keyId);
        }

        if (jwk == null) {
            throw new IllegalArgumentException("No matching key found for kid: " + keyId);
        }

        JWSVerifier verifier = verifierFor(jwk);

        if (!signedJWT.verify(verifier)) {
            throw new IllegalArgumentException("Invalid JWT signature");
        }

        JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

        if (!claims.getIssuer().equals(issuer)) {
            throw new IllegalArgumentException("Invalid JWT issuer");
        }

        if (claims.getExpirationTime() == null || claims.getExpirationTime().before(new java.util.Date())) {
            throw new IllegalArgumentException("JWT has expired");
        }

        return UUID.fromString(claims.getSubject());
    }

    private JWKSet jwks() throws Exception {
        JWKSet current = cachedJwks;
        if (current != null && System.currentTimeMillis() - cachedAt < JWKS_TTL_MS) {
            return current;
        }
        return refreshJwks();
    }

    private synchronized JWKSet refreshJwks() throws Exception {
        cachedJwks = JWKSet.load(new URL(jwksUrl));
        cachedAt = System.currentTimeMillis();
        return cachedJwks;
    }

    /**
     * Supabase projects can sign access tokens with RSA (legacy/default in some
     * projects) or ECDSA keys. Supporting both avoids a ClassCastException when
     * the project uses the newer asymmetric signing keys.
     */
    static JWSVerifier verifierFor(JWK jwk) throws JOSEException {
        if (jwk instanceof RSAKey rsaKey) {
            RSAPublicKey publicKey = rsaKey.toRSAPublicKey();
            return new RSASSAVerifier(publicKey);
        }
        if (jwk instanceof ECKey ecKey) {
            return new ECDSAVerifier(ecKey);
        }
        throw new JOSEException("Unsupported JWK key type: " + jwk.getKeyType());
    }
}
