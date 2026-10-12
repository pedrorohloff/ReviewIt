package com.pedrorohloff.profile;

import com.pedrorohloff.AbstractIntegrationTest;
import com.pedrorohloff.TestDataFactory;
import com.pedrorohloff.exception.BusinessException;
import com.pedrorohloff.exception.ForbiddenException;
import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.profile.dto.ProfileDTO;
import com.pedrorohloff.profile.dto.ProfilePageDTO;
import com.pedrorohloff.profile.dto.ProfileRequestDTO;
import com.pedrorohloff.profile.enums.AccountStatus;
import com.pedrorohloff.profile.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ProfileServiceTest extends AbstractIntegrationTest {

    @Autowired
    private ProfileService profileService;

    @Autowired
    private ProfileRepository profileRepository;

    // ============ HAPPY PATH ============

    @Test
    void shouldReturnPaginatedListOfProfiles() {
        profileRepository.save(TestDataFactory.createProfile("user1"));
        profileRepository.save(TestDataFactory.createProfile("user2"));

        ProfilePageDTO result = profileService.list(0, 10);

        assertNotNull(result);
        assertTrue(result.totalElements() >= 2);
        assertTrue(result.totalPages() >= 1);
        assertFalse(result.hasNext());
    }

    @Test
    void shouldReturnEmptyPageWhenNoProfilesExist() {
        ProfilePageDTO result = profileService.list(0, 10);

        assertNotNull(result);
        assertEquals(0, result.totalElements());
        assertEquals(0, result.totalPages());
        assertFalse(result.hasNext());
    }

    @Test
    void shouldFindProfileById() {
        Profile saved = profileRepository.save(TestDataFactory.createProfile("findme"));

        ProfileDTO result = profileService.findById(saved.getId());

        assertNotNull(result);
        assertEquals(saved.getId(), result.id());
        assertEquals("findme", result.username());
        assertEquals("Regular", result.role());
        assertEquals("Active", result.status());
    }

    @Test
    void shouldCreateProfile() {
        ProfileRequestDTO dto = new ProfileRequestDTO("newuser", "https://example.com/avatar.png");

        ProfileDTO result = profileService.create(dto);

        assertNotNull(result);
        assertNotNull(result.id());
        assertEquals("newuser", result.username());
        assertEquals("https://example.com/avatar.png", result.avatarUrl());
        assertEquals("Regular", result.role());
        assertEquals("Active", result.status());
    }

    @Test
    void shouldUpdateOwnProfile() {
        Profile saved = profileRepository.save(TestDataFactory.createProfile("updateme"));
        ProfileRequestDTO dto = new ProfileRequestDTO("updated", "https://example.com/new.png");

        ProfileDTO result = profileService.update(saved.getId(), saved.getId(), dto);

        assertNotNull(result);
        assertEquals("updated", result.username());
        assertEquals("https://example.com/new.png", result.avatarUrl());
    }

    @Test
    void shouldDeleteOwnProfile() {
        Profile saved = profileRepository.save(TestDataFactory.createProfile("deleteme"));

        profileService.delete(saved.getId(), saved.getId());

        assertFalse(profileRepository.findById(saved.getId()).isPresent());
    }

    // ============ BAD PATH ============

    @Test
    void shouldThrowNotFoundWhenProfileDoesNotExist() {
        UUID randomId = UUID.randomUUID();

        assertThrows(RecordNotFoundException.class, () -> profileService.findById(randomId));
    }

    @Test
    void shouldThrowForbiddenWhenUpdatingAnotherUsersProfile() {
        Profile saved = profileRepository.save(TestDataFactory.createProfile("owner"));
        UUID otherUserId = UUID.randomUUID();
        ProfileRequestDTO dto = new ProfileRequestDTO("hacked", null);

        assertThrows(ForbiddenException.class, () -> profileService.update(saved.getId(), otherUserId, dto));
    }

    @Test
    void shouldThrowForbiddenWhenDeletingAnotherUsersProfile() {
        Profile saved = profileRepository.save(TestDataFactory.createProfile("owner2"));
        UUID otherUserId = UUID.randomUUID();

        assertThrows(ForbiddenException.class, () -> profileService.delete(saved.getId(), otherUserId));
    }

    @Test
    void shouldThrowNotFoundWhenUpdatingNonExistentProfile() {
        UUID randomId = UUID.randomUUID();
        ProfileRequestDTO dto = new ProfileRequestDTO("ghost", null);

        assertThrows(RecordNotFoundException.class, () -> profileService.update(randomId, randomId, dto));
    }

    @Test
    void shouldThrowNotFoundWhenDeletingNonExistentProfile() {
        UUID randomId = UUID.randomUUID();

        assertThrows(RecordNotFoundException.class, () -> profileService.delete(randomId, randomId));
    }

    @Test
    void shouldThrowBusinessExceptionWhenUpdatingSuspendedProfile() {
        Profile saved = profileRepository.save(TestDataFactory.createProfile(
                "suspended", Role.REGULAR, AccountStatus.SUSPENDED, Instant.now().plusSeconds(3600)));
        ProfileRequestDTO dto = new ProfileRequestDTO("suspended", null);

        assertThrows(BusinessException.class, () -> profileService.update(saved.getId(), saved.getId(), dto));
    }

    @Test
    void shouldThrowBusinessExceptionWhenUpdatingBannedProfile() {
        Profile saved = profileRepository.save(TestDataFactory.createProfile(
                "banned", Role.REGULAR, AccountStatus.BANNED, null));
        ProfileRequestDTO dto = new ProfileRequestDTO("banned", null);

        assertThrows(BusinessException.class, () -> profileService.update(saved.getId(), saved.getId(), dto));
    }

    @Test
    void shouldThrowBusinessExceptionWhenDeletingSuspendedProfile() {
        Profile saved = profileRepository.save(TestDataFactory.createProfile(
                "suspended_del", Role.REGULAR, AccountStatus.SUSPENDED, Instant.now().plusSeconds(3600)));

        assertThrows(BusinessException.class, () -> profileService.delete(saved.getId(), saved.getId()));
    }

    @Test
    void shouldThrowBusinessExceptionWhenDeletingBannedProfile() {
        Profile saved = profileRepository.save(TestDataFactory.createProfile(
                "banned_del", Role.REGULAR, AccountStatus.BANNED, null));

        assertThrows(BusinessException.class, () -> profileService.delete(saved.getId(), saved.getId()));
    }
}
