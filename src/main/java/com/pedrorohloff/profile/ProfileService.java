package com.pedrorohloff.profile;

import com.pedrorohloff.exception.BusinessException;
import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.profile.dto.ProfileDTO;
import com.pedrorohloff.profile.dto.ProfileRequestDTO;
import com.pedrorohloff.profile.dto.mapper.ProfileMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;
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

    public List<ProfileDTO> list() {
        return profileRepository.findAll().stream()
                .map(profileMapper::toDTO)
                .toList();
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

    public ProfileDTO update(@NotNull UUID id, @NotNull UUID requesterId, @Valid @NotNull ProfileRequestDTO profileRequestDTO) {
        if (!id.equals(requesterId)) {
            throw new BusinessException("User can only update their own profile");
        }
        return profileRepository.findById(id)
                .map(recordFound -> {
                    recordFound.setUsername(profileRequestDTO.username());
                    recordFound.setAvatarUrl(profileRequestDTO.avatarUrl());
                    return profileMapper.toDTO(profileRepository.save(recordFound));
                })
                .orElseThrow(() -> new RecordNotFoundException(id));
    }

    public void delete(@NotNull UUID id, @NotNull UUID requesterId) {
        if (!id.equals(requesterId)) {
            throw new BusinessException("User can only delete their own profile");
        }
        profileRepository.delete(profileRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id)));
    }
}
