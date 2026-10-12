package com.pedrorohloff.moderation.enums;

public enum ActionType {
    REMOVE("Remove"),
    WARN("Warn"),
    SUSPEND("Suspend"),
    BAN("Ban");

    private String value;

    ActionType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ActionType fromValue(String value) {
        for (ActionType at : values()) {
            if (at.value.equals(value) || at.value.equalsIgnoreCase(value)) {
                return at;
            }
        }
        throw new IllegalArgumentException("Invalid ReportStatus: " + value);
    }

    /**
     * Required by @ValueOfEnum
     */
    @Override
    public String toString() {
        return value;
    }
}
