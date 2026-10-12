package com.pedrorohloff.profile;

import tools.jackson.databind.ObjectMapper;
import com.pedrorohloff.AbstractIntegrationTest;
import com.pedrorohloff.TestDataFactory;
import com.pedrorohloff.profile.dto.ProfileRequestDTO;
import com.pedrorohloff.profile.enums.AccountStatus;
import com.pedrorohloff.profile.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class ProfileControllerTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProfileRepository profileRepository;

    // ============ HAPPY PATH ============

    @Test
    void shouldListProfiles() throws Exception {
        profileRepository.save(TestDataFactory.createProfile("listuser1"));
        profileRepository.save(TestDataFactory.createProfile("listuser2"));

        mockMvc.perform(get("/api/v1/profiles")
                        .param("page", "0")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
    }

    @Test
    void shouldFindProfileById() throws Exception {
        Profile saved = profileRepository.save(TestDataFactory.createProfile("finduser"));

        mockMvc.perform(get("/api/v1/profiles/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("finduser"));
    }

    @Test
    void shouldCreateProfile() throws Exception {
        ProfileRequestDTO dto = new ProfileRequestDTO("newuser", "https://example.com/avatar.png");

        mockMvc.perform(post("/api/v1/profiles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("newuser"));
    }

    @Test
    void shouldUpdateOwnProfile() throws Exception {
        Profile saved = profileRepository.save(TestDataFactory.createProfile("updateuser"));
        ProfileRequestDTO dto = new ProfileRequestDTO("updated", "https://example.com/new.png");

        mockMvc.perform(put("/api/v1/profiles/{id}", saved.getId())
                        .requestAttr("currentUserId", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("updated"));
    }

    @Test
    void shouldDeleteOwnProfile() throws Exception {
        Profile saved = profileRepository.save(TestDataFactory.createProfile("deleteuser"));

        mockMvc.perform(delete("/api/v1/profiles/{id}", saved.getId())
                        .requestAttr("currentUserId", saved.getId()))
                .andExpect(status().isNoContent());
    }

    // ============ BAD PATH ============

    @Test
    void shouldReturn404WhenProfileNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/profiles/{id}", UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturn403WhenUpdatingAnotherUsersProfile() throws Exception {
        Profile saved = profileRepository.save(TestDataFactory.createProfile("owner"));
        ProfileRequestDTO dto = new ProfileRequestDTO("hacked", null);

        mockMvc.perform(put("/api/v1/profiles/{id}", saved.getId())
                        .requestAttr("currentUserId", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn403WhenDeletingAnotherUsersProfile() throws Exception {
        Profile saved = profileRepository.save(TestDataFactory.createProfile("owner2"));

        mockMvc.perform(delete("/api/v1/profiles/{id}", saved.getId())
                        .requestAttr("currentUserId", UUID.randomUUID()))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn400WhenCreatingProfileWithInvalidData() throws Exception {
        ProfileRequestDTO dto = new ProfileRequestDTO("ab", null); // too short

        mockMvc.perform(post("/api/v1/profiles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn409WhenUpdatingSuspendedProfile() throws Exception {
        Profile saved = profileRepository.save(TestDataFactory.createProfile(
                "suspended", Role.REGULAR, AccountStatus.SUSPENDED, Instant.now().plusSeconds(3600)));
        ProfileRequestDTO dto = new ProfileRequestDTO("suspended", null);

        mockMvc.perform(put("/api/v1/profiles/{id}", saved.getId())
                        .requestAttr("currentUserId", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturn409WhenUpdatingBannedProfile() throws Exception {
        Profile saved = profileRepository.save(TestDataFactory.createProfile(
                "banned", Role.REGULAR, AccountStatus.BANNED, null));
        ProfileRequestDTO dto = new ProfileRequestDTO("banned", null);

        mockMvc.perform(put("/api/v1/profiles/{id}", saved.getId())
                        .requestAttr("currentUserId", saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }
}
