package com.pedrorohloff.security;

import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.RSASSAVerifier;
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

        JWKSet jwkSet = JWKSet.load(new URL(jwksUrl));
        var jwk = jwkSet.getKeyByKeyId(signedJWT.getHeader().getKeyID());

        if (jwk == null) {
            throw new IllegalArgumentException("No matching key found for kid: " + signedJWT.getHeader().getKeyID());
        }

        RSAKey rsaKey = (RSAKey) jwk;
        RSAPublicKey publicKey = rsaKey.toRSAPublicKey();

        JWSVerifier verifier = new RSASSAVerifier(publicKey);

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
}
