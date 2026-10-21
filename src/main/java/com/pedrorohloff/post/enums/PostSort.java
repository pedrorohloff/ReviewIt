package com.pedrorohloff.post.enums;

public enum PostSort {
    RECENT("recent"),
    POPULAR("popular");

    private final String value;

    PostSort(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static PostSort fromValue(String value) {
        for (PostSort sort : values()) {
            if (sort.value.equalsIgnoreCase(value)) {
                return sort;
            }
        }
        throw new IllegalArgumentException("Invalid PostSort: " + value);
    }

    /**
     * Required by @ValueOfEnum
     */
    @Override
    public String toString() {
        return value;
    }
}
