package com.pedrorohloff.moderation.enums;

public enum ReportStatus {
    PENDING("Pending"),
    RESOLVED("Resolved");

    private String value;

    ReportStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ReportStatus fromValue(String value) {
        for (ReportStatus rs : values()) {
            if (rs.value.equals(value) || rs.value.equalsIgnoreCase(value)) {
                return rs;
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
