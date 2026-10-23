package com.pedrorohloff.auth;

import com.pedrorohloff.auth.dto.AuthResponseDTO;
import com.pedrorohloff.auth.dto.LoginRequestDTO;
import com.pedrorohloff.auth.dto.RegisterRequestDTO;
import com.pedrorohloff.exception.BusinessException;
import com.pedrorohloff.exception.ForbiddenException;
import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.exception.UnauthorizedException;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import com.pedrorohloff.profile.dto.mapper.ProfileMapper;
import com.pedrorohloff.profile.enums.AccountStatus;
import com.pedrorohloff.profile.enums.Role;
import com.pedrorohloff.security.AppJwtService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;

@Service
@Validated
public class AuthAccountService {

    private static final int BCRYPT_MAX_PASSWORD_BYTES = 72;
    private static final String INVALID_CREDENTIALS = "Invalid email or password";

    private final AppCredentialRepository credentialRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppJwtService appJwtService;
    private final ProfileMapper profileMapper;

    public AuthAccountService(
            AppCredentialRepository credentialRepository,
            ProfileRepository profileRepository,
            PasswordEncoder passwordEncoder,
            AppJwtService appJwtService,
            ProfileMapper profileMapper) {
        this.credentialRepository = credentialRepository;
        this.profileRepository = profileRepository;
        this.passwordEncoder = passwordEncoder;
        this.appJwtService = appJwtService;
        this.profileMapper = profileMapper;
    }

    @Transactional
    public AuthResponseDTO register(@Valid @NotNull RegisterRequestDTO request) {
        String username = normalizeUsername(request.username());
        String email = normalizeEmail(request.email());
        validatePassword(request.password());

        if (credentialRepository.existsByEmail(email)) {
            throw new BusinessException("Email is already registered");
        }
        if (profileRepository.existsByUsernameIgnoreCase(username)) {
            throw new BusinessException("Username is already in use");
        }

        Profile profile = new Profile();
        profile.setId(UUID.randomUUID());
        profile.setUsername(username);
        profile.setRole(Role.REGULAR);
        profile.setAccountStatus(AccountStatus.ACTIVE);
        profile.setOnboarded(true);
        Profile savedProfile = profileRepository.save(profile);

        AppCredential credential = new AppCredential();
        credential.setProfileId(savedProfile.getId());
        credential.setEmail(email);
        credential.setPasswordHash(passwordEncoder.encode(request.password()));
        credentialRepository.save(credential);

        return issueToken(savedProfile, email);
    }

    @Transactional(readOnly = true)
    public AuthResponseDTO login(@Valid @NotNull LoginRequestDTO request) {
        String email = normalizeEmail(request.email());

        AppCredential credential = credentialRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException(INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.password(), credential.getPasswordHash())) {
            throw new UnauthorizedException(INVALID_CREDENTIALS);
        }

        Profile profile = profileRepository.findById(credential.getProfileId())
                .orElseThrow(() -> new RecordNotFoundException("Profile", credential.getProfileId()));

        if (profile.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException("Account is not active");
        }

        return issueToken(profile, email);
    }

    private AuthResponseDTO issueToken(Profile profile, String email) {
        AppJwtService.IssuedToken token = appJwtService.issue(profile.getId(), email);
        return new AuthResponseDTO(
                token.value(),
                "Bearer",
                token.expiresAt(),
                email,
                profileMapper.toDTO(profile));
    }

    private String normalizeUsername(String username) {
        String normalized = username == null ? "" : username.trim();
        if (normalized.length() < 3 || normalized.length() > 50) {
            throw new IllegalArgumentException("Username must be between 3 and 50 characters");
        }
        return normalized;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private void validatePassword(String password) {
        if (password != null
                && password.getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_PASSWORD_BYTES) {
            throw new IllegalArgumentException(
                    "Password must not exceed " + BCRYPT_MAX_PASSWORD_BYTES + " bytes");
        }
    }
}
