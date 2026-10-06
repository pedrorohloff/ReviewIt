package com.pedrorohloff.comment;

import com.pedrorohloff.comment.dto.CommentDTO;
import com.pedrorohloff.comment.dto.CommentPageDTO;
import com.pedrorohloff.comment.dto.CommentRequestDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Validated
@RestController
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/api/v1/posts/{postId}/comments")
    public CommentPageDTO findAllByPost(@PathVariable @NotNull UUID postId,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "10") int pageSize) {
        return commentService.findAllByPost(postId, page, pageSize);
    }

    @GetMapping("/api/v1/comments/{id}")
    public CommentDTO findById(@PathVariable @NotNull UUID id) {
        return commentService.findById(id);
    }

    @PostMapping("/api/v1/posts/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentDTO create(@PathVariable @NotNull UUID postId,
                             @RequestAttribute("currentUserId") UUID authorId,
                             @RequestBody @Valid CommentRequestDTO dto) {
        return commentService.create(postId, authorId, dto);
    }

    @PutMapping("/api/v1/comments/{id}")
    public CommentDTO update(@PathVariable @NotNull UUID id,
                             @RequestAttribute("currentUserId") UUID requesterId,
                             @RequestBody @Valid CommentRequestDTO dto) {
        return commentService.update(id, requesterId, dto);
    }

    @DeleteMapping("/api/v1/comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable @NotNull UUID id,
                       @RequestAttribute("currentUserId") UUID requesterId) {
        commentService.delete(id, requesterId);
    }
}
