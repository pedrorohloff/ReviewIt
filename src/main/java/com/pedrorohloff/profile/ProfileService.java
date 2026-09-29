package com.pedrorohloff.profile;

import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.profile.dto.ProfileDTO;
import com.pedrorohloff.profile.dto.mapper.ProfileMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
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

     public ProfileDTO findById(@Valid @NotNull @NotBlank UUID id) {
        return profileRepository.findById(id).stream()
                .map(profileMapper::toDTO)
                .findFirst()
                .orElseThrow(() -> new RecordNotFoundException(id));
     }

     public ProfileDTO create(@Valid @NotNull ProfileDTO profileDTO) {
        return profileMapper.toDTO(profileRepository.save(profileMapper.toEntity(profileDTO)));
     }

     public ProfileDTO update(@Valid @NotNull UUID id, @Valid @NotNull ProfileDTO profileDTO) {
         return profileRepository.findById(id)
                 .map(recordFound -> {
                     recordFound.setUsername(profileDTO.username());
                     recordFound.setAvatarUrl(profileDTO.avatarUrl());
                     recordFound.setRole(profileMapper.convertRoleValue(profileDTO.role()));
                     recordFound.setStatus(profileMapper.convertStatusValue(profileDTO.status()));
                     return profileMapper.toDTO(profileRepository.save(recordFound));
                 })
                 .orElseThrow(() -> new RecordNotFoundException(id));
     }

     public void delete(@Valid @NotNull @NotBlank UUID id) {
         profileRepository.delete(profileRepository.findById(id)
                 .orElseThrow(() -> new RecordNotFoundException(id)));
     }
}
