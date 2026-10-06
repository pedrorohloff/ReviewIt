package com.pedrorohloff.profile;

import com.pedrorohloff.profile.dto.ProfileDTO;
import com.pedrorohloff.profile.dto.ProfilePageDTO;
import com.pedrorohloff.profile.dto.ProfileRequestDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1/profiles")
public class ProfileController {
    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ProfilePageDTO list(@RequestParam(defaultValue = "0") @PositiveOrZero int page,
                               @RequestParam(defaultValue = "10") @Positive @Max(100) int pageSize) {
        return profileService.list(page, pageSize);
    }

    @GetMapping("/{id}")
    public ProfileDTO findById(@PathVariable("id") @Valid @NotNull UUID id) {
        return profileService.findById(id);
    }

    @PostMapping
    @ResponseStatus(code = HttpStatus.CREATED)
    public ProfileDTO create(@RequestBody @Valid @NotNull ProfileRequestDTO profileRequestDTO) {
        return profileService.create(profileRequestDTO);
    }

    @PutMapping("/{id}")
    public ProfileDTO update(@PathVariable("id") @Valid @NotNull UUID id,
                             @RequestAttribute("currentUserId") UUID requesterId,
                             @RequestBody @Valid @NotNull ProfileRequestDTO profileRequestDTO) {
        return profileService.update(id, requesterId, profileRequestDTO);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") @Valid @NotNull UUID id,
                       @RequestAttribute("currentUserId") UUID requesterId) {
        profileService.delete(id, requesterId);
    }
}
