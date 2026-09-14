package com.jobtracker.exception;

/**
 * Thrown when a requested resource (entity, file, etc.) cannot be found,
 * or does not belong to the current user.
 * <p>
 * Handled by {@link GlobalExceptionHandler} and mapped to HTTP 404.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
