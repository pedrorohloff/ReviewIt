package com.pedrorohloff.profile.enums;

public enum Role {
    REGULAR("Regular"),
    MODERATOR("Moderator"),
    ADMIN("Admin");

    private String value;

    Role(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static Role fromValue(String value) {
        for (Role role : values()) {
            if (role.value.equals(value)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Invalid Role: " + value);
    }

    /**
     * Required by @ValueOfEnum
     */
    @Override
    public String toString() {
        return value;
    }
}
