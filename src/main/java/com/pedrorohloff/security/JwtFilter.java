package com.pedrorohloff.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                UUID currentUserId = extractUserIdFromToken(token);
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
            }
        }

        filterChain.doFilter(request, response);
    }

    private UUID extractUserIdFromToken(String token) {
        // TODO: Implementar validação real do JWT com JWKS do Supabase
        // Por enquanto, extrai o subject do token (claim "sub")
        // Em produção, usar biblioteca como nimbus-jose-jwt para validar assinatura
        try {
            String[] parts = token.split("\\.");
            if (parts.length == 3) {
                String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
                // Extrai "sub" do payload JSON
                int subStart = payload.indexOf("\"sub\":\"");
                if (subStart != -1) {
                    subStart += 7;
                    int subEnd = payload.indexOf("\"", subStart);
                    return UUID.fromString(payload.substring(subStart, subEnd));
                }
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }
}
