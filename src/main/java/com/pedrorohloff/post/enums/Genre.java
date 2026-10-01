package com.pedrorohloff.post.enums;

public enum Genre {
    ACTION("Action"),
    ROMANCE("Romance"),
    HORROR("Horror"),
    COMEDY("Comedy"),
    DRAMA("Drama");

    private String value;

    private Genre(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static Genre fromValue(String value) {
        for (Genre genre : values()) {
            if (genre.value.equals(value) || genre.value.equalsIgnoreCase(value)) {
                return genre;
            }
        }
        throw new IllegalArgumentException("Invalid Genre: " + value);
    }

    /**
     * Required by @ValueOfEnum
     */
    @Override
    public String toString() {
        return value;
    }
}
