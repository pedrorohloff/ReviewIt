package com.pedrorohloff.profile.enums;

public enum AccountStatus {
    ACTIVE("Active"),
    INACTIVE("Inactive"),
    SUSPENDED("Suspended"),
    BANNED("Banned");

    private String value;

    AccountStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static AccountStatus fromValue(String value) {
        for (AccountStatus accountStatus : values()) {
            if (accountStatus.value.equals(value)) {
                return accountStatus;
            }
        }
        throw new IllegalArgumentException("Invalid status: " + value);
    }

    /**
     * Required by @ValueOfEnum
     */
    @Override
    public String toString() {
        return value;
    }
}
