package com.pedrorohloff.post.enums;

public enum Genre {
    ACTION("Action"), DRAMA("Drama"), ROMANCE("Romance");

    private String value;

    private Genre(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }
}
