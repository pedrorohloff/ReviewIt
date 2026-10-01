package com.pedrorohloff.profile.dto.mapper;

import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.dto.ProfileDTO;
import com.pedrorohloff.profile.dto.ProfileRequestDTO;
import com.pedrorohloff.profile.dto.ProfileSummaryDTO;
import com.pedrorohloff.profile.enums.Role;
import com.pedrorohloff.profile.enums.AccountStatus;
import org.springframework.stereotype.Component;

@Component
public class ProfileMapper {

    public ProfileDTO toDTO(Profile profile) {
        if (profile == null) {
            return null;
        }
        return new ProfileDTO(
                profile.getId(),
                profile.getUsername(),
                profile.getAvatarUrl(),
                profile.getRole().getValue(),
                profile.getAccountStatus().getValue(),
                profile.getSuspendedUntil(),
                profile.getCreatedAt()
        );
    }

    public ProfileSummaryDTO toSummaryDTO(Profile profile) {
        if (profile == null) {
            return null;
        }
        return new ProfileSummaryDTO(
                profile.getId(),
                profile.getUsername(),
                profile.getAvatarUrl()
        );
    }

    public Profile toModel(ProfileRequestDTO profileRequestDTO) {
        if (profileRequestDTO == null) {
            return null;
        }
        Profile profile = new Profile();
        profile.setUsername(profileRequestDTO.username());
        profile.setAvatarUrl(profileRequestDTO.avatarUrl());
        return profile;
    }

    public AccountStatus convertStatusValue(String value) {
        if (value == null) {
            return null;
        }
        return AccountStatus.fromValue(value);
    }

    public Role convertRoleValue(String value) {
        if (value == null) {
            return null;
        }
        return Role.fromValue(value);
    }

}
