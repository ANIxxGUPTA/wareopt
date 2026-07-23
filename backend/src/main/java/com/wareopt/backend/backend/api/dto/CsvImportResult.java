package com.wareopt.backend.backend.api.dto;

import java.util.ArrayList;
import java.util.List;

public class CsvImportResult {
    private int status;
    private String message;
    private List<CsvError> errors = new ArrayList<>();

    public CsvImportResult() {
    }

    public CsvImportResult(int status, String message) {
        this.status = status;
        this.message = message;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<CsvError> getErrors() {
        return errors;
    }

    public void setErrors(List<CsvError> errors) {
        this.errors = errors;
    }

    public void addError(int row, String error) {
        this.errors.add(new CsvError(row, error));
    }

    public static class CsvError {
        private int row;
        private String error;

        public CsvError() {
        }

        public CsvError(int row, String error) {
            this.row = row;
            this.error = error;
        }

        public int getRow() {
            return row;
        }

        public void setRow(int row) {
            this.row = row;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }
    }
}
