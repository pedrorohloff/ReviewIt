package com.pedrorohloff.comment;

import com.pedrorohloff.comment.dto.CommentDTO;
import com.pedrorohloff.comment.dto.mapper.CommentMapper;
import com.pedrorohloff.exception.RecordNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.UUID;

@Service
@Validated
public class CommentService {
    private final CommentRepository commentRepository;
    private final CommentMapper commentMapper;

    public CommentService(CommentRepository commentRepository, CommentMapper commentMapper) {
        this.commentRepository = commentRepository;
        this.commentMapper = commentMapper;
    }

    public List<CommentDTO> list() {
        return commentRepository.findAll().stream()
                .map(commentMapper::toDTO)
                .toList();
    }

    public CommentDTO findById(@NotNull UUID id) {
        return commentRepository.findById(id)
                .map(commentMapper::toDTO)
                .orElseThrow(() -> new RecordNotFoundException(id));
    }

    public CommentDTO create(@NotNull @Valid CommentDTO commentDTO) {
        return commentMapper.toDTO(commentRepository.save(commentMapper.toEntity(commentDTO)));
    }

    public CommentDTO update(@NotNull UUID id, @NotNull @Valid CommentDTO commentDTO) {
        return commentRepository.findById(id)
                .map(recordFound -> {
                    recordFound.setContent(commentDTO.content());
                    return commentMapper.toDTO(commentRepository.save(recordFound));
                })
                .orElseThrow(() -> new RecordNotFoundException(id));
    }

    public void delete(@NotNull UUID id) {
        commentRepository.delete(commentRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id)));
    }
}
