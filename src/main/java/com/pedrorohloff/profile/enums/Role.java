package com.pedrorohloff.profile.enums;

public enum Role {
    USER("User"), MODERATOR("Moderator"), ADMIN("Admin");

    private String value;

    private Role(String value) {
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

    @Override
    public String toString() {
        return value;
    }
}
