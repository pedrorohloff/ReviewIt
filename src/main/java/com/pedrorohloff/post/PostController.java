package com.pedrorohloff.post;

import com.pedrorohloff.post.dto.PostDTO;
import com.pedrorohloff.post.dto.PostPageDTO;
import com.pedrorohloff.post.dto.PostRequestDTO;
import com.pedrorohloff.post.dto.UpdateNotificationSettingsRequestDTO;
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
@RequestMapping("/api/v1/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public PostPageDTO findAll(@RequestParam(defaultValue = "0") @PositiveOrZero int page,
                               @RequestParam(defaultValue = "10") @Positive @Max(100) int pageSize) {
        return postService.findAll(page, pageSize);
    }

    @GetMapping("/{id}")
    public PostDTO findById(@PathVariable @NotNull UUID id) {
        return postService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostDTO create(@RequestAttribute("currentUserId") UUID authorId,
                          @RequestBody @Valid PostRequestDTO postRequestDTO) {
        return postService.create(authorId, postRequestDTO);
    }

    @PutMapping("/{id}")
    public PostDTO update(@PathVariable @NotNull UUID id,
                          @RequestAttribute("currentUserId") UUID requesterId,
                          @RequestBody @Valid PostRequestDTO postRequestDTO) {
        return postService.update(id, requesterId, postRequestDTO);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable @NotNull UUID id,
                       @RequestAttribute("currentUserId") UUID requesterId) {
        postService.delete(id, requesterId);
    }

    @PatchMapping("/{id}/notification-settings")
    public PostDTO updateNotificationSettings(@PathVariable @NotNull UUID id,
                                              @RequestAttribute("currentUserId") UUID requesterId,
                                              @RequestBody @Valid UpdateNotificationSettingsRequestDTO dto) {
        return postService.updateNotificationSettings(id, requesterId, dto);
    }
}
