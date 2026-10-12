package com.pedrorohloff.notification.enums;

public enum DeliveryChannel {
    IN_APP("In-App"),
    EMAIL("Email");

    private final String value;

    DeliveryChannel(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static DeliveryChannel fromValue(String value) {
        for (DeliveryChannel channel : values()) {
            if (channel.value.equalsIgnoreCase(value) || channel.name().equalsIgnoreCase(value)) {
                return channel;
            }
        }
        throw new IllegalArgumentException("Invalid DeliveryChannel: " + value);
    }

    @Override
    public String toString() {
        return value;
    }
}
