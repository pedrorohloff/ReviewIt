package com.pedrorohloff.like;

import com.pedrorohloff.like.dto.ToggleLikeDTO;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class LikeController {
    private final LikeService likeService;

    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    @PostMapping("/comments/{commentId}/like")
    public ToggleLikeDTO toggleCommentLike(@PathVariable("commentId") UUID commentId,
                                           @RequestAttribute("currentUserId") UUID userId) {
        return likeService.toggleCommentLike(commentId, userId);
    }

    @PostMapping("/posts/{postId}/like")
    public ToggleLikeDTO togglePostLike(@PathVariable("postId") UUID postId,
                                        @RequestAttribute("currentUserId") UUID userId) {
        return likeService.togglePostLike(postId, userId);
    }
}
