package com.wareopt.backend.backend.exception;

import com.wareopt.backend.backend.api.dto.ApiError;
import com.wareopt.backend.backend.optimization.InfeasibleSolutionException;
import com.wareopt.backend.backend.exception.OptimizationInProgressException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.dao.DataIntegrityViolationException;
import java.util.ArrayList;
import java.util.List;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InfeasibleSolutionException.class)
    public ResponseEntity<ApiError> handleInfeasibleSolution(InfeasibleSolutionException ex) {
        ApiError error = new ApiError(HttpStatus.UNPROCESSABLE_ENTITY.value(), ex.getMessage(), ex.getReasons());
        return new ResponseEntity<>(error, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @ExceptionHandler(OptimizationInProgressException.class)
    public ResponseEntity<ApiError> handleOptimizationInProgress(OptimizationInProgressException ex) {
        ApiError error = new ApiError(HttpStatus.CONFLICT.value(), ex.getMessage(), null);
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    @SuppressWarnings("deprecation")
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatusException(ResponseStatusException ex) {
        ApiError error = new ApiError(ex.getStatusCode().value(), ex.getReason(), null);
        return new ResponseEntity<>(error, ex.getStatusCode());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String errorMsg = "Cannot delete or modify record because it is referenced by other data, or it violates a unique constraint.";
        String msg = ex.getMessage();
        
        if (msg != null && msg.toLowerCase().contains("duplicate key")) {
            errorMsg = "A record with these unique values already exists.";
        } else if (ex.getCause() instanceof org.hibernate.exception.ConstraintViolationException) {
            String constraintName = ((org.hibernate.exception.ConstraintViolationException) ex.getCause()).getConstraintName();
            if (constraintName != null) {
                constraintName = constraintName.toLowerCase();
                if (constraintName.contains("worker")) {
                    errorMsg = "Cannot delete worker: they have active shift assignments. Remove assignments or re-run optimization first.";
                } else if (constraintName.contains("shift")) {
                    errorMsg = "Cannot delete shift: it has active worker assignments. Remove assignments or re-run optimization first.";
                }
            }
        }
        
        ApiError error = new ApiError(HttpStatus.CONFLICT.value(), errorMsg, null);
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationExceptions(MethodArgumentNotValidException ex) {
        List<String> details = new ArrayList<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            details.add(error.getField() + ": " + error.getDefaultMessage());
        }
        ApiError error = new ApiError(HttpStatus.BAD_REQUEST.value(), "Validation Failed", details);
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleAllExceptions(Exception ex) {
        ex.printStackTrace();
        ApiError error = new ApiError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "An unexpected error occurred: " + ex.getMessage(), null);
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
