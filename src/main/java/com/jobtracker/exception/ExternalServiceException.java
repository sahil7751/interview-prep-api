package com.jobtracker.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a call to an external/upstream service (e.g. the Groq AI
 * API) fails or returns an unusable response. Mirrors the pattern already
 * established by {@link GroqServiceException}, for services that call
 * external APIs directly rather than through {@code GroqService}.
 * <p>
 * Handled by {@link GlobalExceptionHandler}. Defaults to HTTP 502 (Bad
 * Gateway), matching the existing convention for upstream failures.
 */
public class ExternalServiceException extends RuntimeException {

    private final HttpStatus status;

    public ExternalServiceException(String message) {
        this(HttpStatus.BAD_GATEWAY, message);
    }

    public ExternalServiceException(String message, Throwable cause) {
        this(HttpStatus.BAD_GATEWAY, message, cause);
    }

    public ExternalServiceException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public ExternalServiceException(HttpStatus status, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
