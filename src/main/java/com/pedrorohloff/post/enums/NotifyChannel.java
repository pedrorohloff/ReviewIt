package com.pedrorohloff.post.enums;

public enum NotifyChannel {
    NONE("None"),
    IN_APP("In-App"),
    EMAIL("Email"),
    BOTH("Both");

    private final String value;

    NotifyChannel(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static NotifyChannel fromValue(String value) {
        for (NotifyChannel nc : values()) {
            if (nc.value.equals(value) || nc.value.equalsIgnoreCase(value)) {
                return nc;
            }
        }
        throw new IllegalArgumentException("Invalid NotifyChannel: " + value);
    }

    /**
     * Required by @ValueOfEnum
     */
    @Override
    public String toString() {
        return value;
    }
}
