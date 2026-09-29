package com.pedrorohloff.profile.enums;

public enum Status {
    ACTIVE("Active"), INACTIVE("Inactive"), SUSPENDED("Suspended"), BANNED("Banned");

    private String value;

    private Status(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static Status fromValue(String value) {
        for (Status status : values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid status: " + value);
    }

    @Override
    public String toString() {
        return value;
    }
}
