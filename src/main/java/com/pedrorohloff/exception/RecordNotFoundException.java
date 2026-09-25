package com.pedrorohloff.exception;

import java.util.UUID;

public class RecordNotFoundException extends RuntimeException {
    public RecordNotFoundException(UUID id) {
        super("Record not found with id: " + id);
    }
}
