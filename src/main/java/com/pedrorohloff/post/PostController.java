package com.pedrorohloff.post;

import com.pedrorohloff.post.dto.PostDTO;
import com.pedrorohloff.post.dto.PostRequestDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/posts")
public class PostController {
    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public List<PostDTO> list() {
        return postService.list();
    }

    @GetMapping("/{id}")
    public PostDTO findById(@PathVariable("id") @Valid UUID id) {
        return postService.findById(id);
    }

    @PostMapping
    @ResponseStatus(code = HttpStatus.CREATED)
    public PostDTO create(@RequestAttribute("currentUserId") UUID authorId,
                          @RequestBody @Valid @NotNull PostRequestDTO postRequestDTO) {
        return postService.create(authorId, postRequestDTO);
    }

    @PutMapping("/{id}")
    public PostDTO update(@PathVariable("id") @Valid @NotNull UUID id,
                          @RequestAttribute("currentUserId") UUID requesterId,
                          @RequestBody @Valid @NotNull PostRequestDTO postRequestDTO) {
        return postService.update(id, requesterId, postRequestDTO);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") @Valid @NotNull UUID id,
                       @RequestAttribute("currentUserId") UUID requesterId) {
        postService.delete(id, requesterId);
    }
}
