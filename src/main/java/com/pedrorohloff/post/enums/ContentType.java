package com.pedrorohloff.post.enums;

public enum ContentType {
    BOOK("Book"),
    MOVIE("Movie"),
    ALBUM("Album"),
    GAME("Game");

    private final String value;

    ContentType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ContentType fromValue(String value) {
        for (ContentType ct : values()) {
            if (ct.value.equals(value) || ct.value.equalsIgnoreCase(value)) {
                return ct;
            }
        }
        throw new IllegalArgumentException("Invalid ContentType: " + value);
    }

    /**
     * Required by @ValueOfEnum
     */
    @Override
    public String toString() {
        return value;
    }
}
