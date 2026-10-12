package com.pedrorohloff.notification.enums;

public enum NotificationType {
    LIKE_MILESTONE("Like Milestone"),
    NEW_COMMENT("New Comment");

    private final String value;

    NotificationType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static NotificationType fromValue(String value) {
        for (NotificationType type : values()) {
            if (type.value.equalsIgnoreCase(value) || type.name().equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid NotificationType: " + value);
    }

    @Override
    public String toString() {
        return value;
    }
}
