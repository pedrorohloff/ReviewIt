package com.pedrorohloff.post;

import com.pedrorohloff.post.enums.ContentType;
import com.pedrorohloff.post.enums.Genre;
import com.pedrorohloff.post.enums.NotifyChannel;
import com.pedrorohloff.post.enums.converters.ContentTypeConverter;
import com.pedrorohloff.post.enums.converters.GenreConverter;
import com.pedrorohloff.post.enums.converters.NotifyChannelConverter;
import com.pedrorohloff.shared.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.validator.constraints.Length;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
public class Post extends BaseEntity {

    @NotNull
    @Column(nullable = false, name = "author_id")
    private UUID authorId;

    @NotBlank
    @NotNull
    @Length(min = 5, max = 200)
    @Column(nullable = false, length = 200)
    private String title;

    @NotNull
    @Column(nullable = false, name = "content_type", length = 20)
    @Convert(converter = ContentTypeConverter.class)
    private ContentType contentType;

    @NotNull
    @Convert(converter = GenreConverter.class)
    @Column(nullable = false)
    private Genre genre;

    @NotBlank
    @NotNull
    @Length(min = 10, max = 5000)
    @Column(nullable = false, length = 5000)
    private String content;

    @NotBlank
    @NotNull
    @Column(nullable = false, name = "notify_enabled")
    private boolean notifyEnabled;

    @NotNull
    @Column(nullable = false, name = "notify_channel", length = 20)
    @Convert(converter = NotifyChannelConverter.class)
    private NotifyChannel notifyChannel;

    @Column(nullable = false, name = "updated_at")
    private Instant updatedAt = Instant.now();
}
