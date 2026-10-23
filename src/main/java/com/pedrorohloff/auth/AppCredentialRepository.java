package com.pedrorohloff.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppCredentialRepository extends JpaRepository<AppCredential, UUID> {

    Optional<AppCredential> findByEmail(String email);

    boolean existsByEmail(String email);
}
