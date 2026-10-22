package com.pedrorohloff.security;

import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.ECDSAVerifier;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.Curve;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.gen.ECKeyGenerator;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtFilterTest {

    @Test
    void supportsRsaSigningKeys() throws Exception {
        JWK jwk = new RSAKeyGenerator(2048).keyID("rsa-key").generate();

        JWSVerifier verifier = JwtFilter.verifierFor(jwk);

        assertThat(verifier).isInstanceOf(RSASSAVerifier.class);
    }

    @Test
    void supportsEcdsaSigningKeys() throws Exception {
        JWK jwk = new ECKeyGenerator(Curve.P_256).keyID("ec-key").generate();

        JWSVerifier verifier = JwtFilter.verifierFor(jwk);

        assertThat(verifier).isInstanceOf(ECDSAVerifier.class);
    }
}
