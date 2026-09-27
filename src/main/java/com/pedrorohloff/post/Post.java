package com.pedrorohloff.post;

import com.pedrorohloff.post.enums.Status;
import com.pedrorohloff.post.enums.converters.StatusConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.SQLDelete;

import java.util.Objects;
import java.util.UUID;

@SQLDelete(sql = "UPDATE post SET status = 'Inactive' WHERE id=?")
@Entity
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String content;

    @Convert(converter = StatusConverter.class)
    @Column(nullable = false)
    private Status status;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Post post = (Post) o;
        return Objects.equals(id, post.id) && Objects.equals(title, post.title) && Objects.equals(content, post.content) && Objects.equals(status, post.status);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, title, content, status);
    }
}
