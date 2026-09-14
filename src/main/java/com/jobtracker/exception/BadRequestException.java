package com.jobtracker.exception;

/**
 * Thrown when a request is well-formed but violates a business rule or
 * input constraint that isn't already covered by Jakarta Bean Validation
 * (e.g. invalid file type, mismatched passwords, unknown status value).
 * <p>
 * Handled by {@link GlobalExceptionHandler} and mapped to HTTP 400.
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }

    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}
