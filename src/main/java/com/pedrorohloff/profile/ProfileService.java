package com.pedrorohloff.profile;

import com.pedrorohloff.exception.BusinessException;
import com.pedrorohloff.exception.ForbiddenException;
import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.profile.dto.ProfileDTO;
import com.pedrorohloff.profile.dto.ProfilePageDTO;
import com.pedrorohloff.profile.dto.ProfileRequestDTO;
import com.pedrorohloff.profile.dto.mapper.ProfileMapper;
import com.pedrorohloff.profile.enums.AccountStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

@Service
@Validated
public class ProfileService {
    private final ProfileRepository profileRepository;
    private final ProfileMapper profileMapper;

    public ProfileService(ProfileRepository profileRepository, ProfileMapper profileMapper) {
        this.profileRepository = profileRepository;
        this.profileMapper = profileMapper;
    }

    @Transactional(readOnly = true)
    public ProfilePageDTO list(int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<Profile> profilePage = profileRepository.findAll(pageable);

        var profiles = profilePage.getContent().stream()
                .map(profileMapper::toDTO)
                .toList();

        return new ProfilePageDTO(
                profiles,
                profilePage.getTotalElements(),
                profilePage.getTotalPages(),
                profilePage.hasNext()
        );
    }

    public ProfileDTO findById(@NotNull UUID id) {
        return profileRepository.findById(id)
                .map(profileMapper::toDTO)
                .orElseThrow(() -> new RecordNotFoundException(id));
    }

    public ProfileDTO create(@Valid @NotNull ProfileRequestDTO profileRequestDTO) {
        Profile profile = profileMapper.toModel(profileRequestDTO);
        return profileMapper.toDTO(profileRepository.save(profile));
    }

    @Transactional
    public ProfileDTO update(@NotNull UUID id, @NotNull UUID requesterId, @Valid @NotNull ProfileRequestDTO profileRequestDTO) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id));

        if (!id.equals(requesterId)) {
            throw new ForbiddenException("You can only update your own profile");
        }

        checkAccountStatus(profile);

        profile.setUsername(profileRequestDTO.username());
        profile.setAvatarUrl(profileRequestDTO.avatarUrl());

        return profileMapper.toDTO(profileRepository.save(profile));
    }

    @Transactional
    public void delete(@NotNull UUID id, @NotNull UUID requesterId) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id));

        if (!id.equals(requesterId)) {
            throw new ForbiddenException("You can only delete your own profile");
        }

        checkAccountStatus(profile);

        profileRepository.delete(profile);
    }

    private void checkAccountStatus(Profile profile) {
        if (profile.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new BusinessException("Account is suspended");
        }
        if (profile.getAccountStatus() == AccountStatus.BANNED) {
            throw new BusinessException("Account is banned");
        }
    }
}
