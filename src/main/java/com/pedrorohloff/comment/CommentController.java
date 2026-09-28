package com.pedrorohloff.comment;

import com.pedrorohloff.comment.dto.CommentDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/comments")
public class CommentController {
    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public List<CommentDTO> list() {
        return commentService.list();
    }

    @GetMapping("/{id}")
    public CommentDTO findById(@PathVariable("id") @NotNull UUID id) {
        return commentService.findById(id);
    }

    @PostMapping
    @ResponseStatus(code = HttpStatus.CREATED)
    public CommentDTO create(@RequestBody @NotNull @Valid CommentDTO commentDTO) {
        return commentService.create(commentDTO);
    }

    @PutMapping("/{id}")
    public CommentDTO update(@PathVariable("id") @NotNull UUID id, @RequestBody @NotNull @Valid CommentDTO commentDTO) {
        return commentService.update(id, commentDTO);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") @NotNull UUID id) {
        commentService.delete(id);
    }
}
