package com.pedrorohloff.comment;

import com.pedrorohloff.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.Length;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "comments")
@Getter
@Setter
@NoArgsConstructor
public class Comment extends BaseEntity {

    @NotNull
    @Column(name = "post_id", nullable = false)
    private UUID postId;

    @NotNull
    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @NotBlank
    @NotNull
    @Length(min = 1, max = 2000)
    @Column(nullable = false, length = 2000)
    private String content;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
