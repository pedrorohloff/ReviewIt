package com.pedrorohloff.post.dto;

import java.util.List;

public record PostPageDTO(
        List<PostDTO> content,
        long totalElements,
        int totalPages,
        boolean hasNext
) {
}
