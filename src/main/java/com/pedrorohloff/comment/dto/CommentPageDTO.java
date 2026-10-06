package com.pedrorohloff.comment.dto;

import java.util.List;

public record CommentPageDTO(
        List<CommentDTO> comments,
        long totalElements,
        int totalPages
) {}
