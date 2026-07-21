package com.wareopt.backend.backend.api.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ApiError {
    private int status;
    private String message;
    private LocalDateTime timestamp;
    private List<String> details;

    public ApiError(int status, String message, List<String> details) {
        this.status = status;
        this.message = message;
        this.details = details;
        this.timestamp = LocalDateTime.now();
    }

    public int getStatus() { return status; }
    public String getMessage() { return message; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public List<String> getDetails() { return details; }
}
