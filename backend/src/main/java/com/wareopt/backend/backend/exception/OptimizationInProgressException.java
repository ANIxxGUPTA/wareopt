package com.wareopt.backend.backend.exception;

public class OptimizationInProgressException extends RuntimeException {
    public OptimizationInProgressException(String message) {
        super(message);
    }
}
