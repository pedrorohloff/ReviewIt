package com.pedrorohloff.profile.dto.mapper;

import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.dto.ProfileDTO;
import com.pedrorohloff.profile.enums.Role;
import com.pedrorohloff.profile.enums.Status;
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
                profile.getStatus().getValue()
        );
    }

    public Profile toEntity(ProfileDTO profileDTO) {
        if (profileDTO == null) {
            return null;
        }

        Profile profile = new Profile();
        if (profileDTO.id() != null) {
            profile.setId(profileDTO.id());
        }
        profile.setUsername(profileDTO.username());
        profile.setAvatarUrl(profileDTO.avatarUrl());
        profile.setRole(convertRoleValue(profileDTO.role()));
        profile.setStatus(convertStatusValue(profileDTO.status()));
        return profile;
    }


    public Status convertStatusValue(String value) {
        if (value == null) {
            return null;
        }
        return Status.fromValue(value);
    }

    public Role convertRoleValue(String value) {
        if (value == null) {
            return null;
        }
        return Role.fromValue(value);
    }

}
