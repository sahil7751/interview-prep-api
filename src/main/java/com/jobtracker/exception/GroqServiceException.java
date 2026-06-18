package com.jobtracker.exception;

import org.springframework.http.HttpStatus;

public class GroqServiceException extends RuntimeException {

    private final HttpStatus status;

    public GroqServiceException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public GroqServiceException(HttpStatus status, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}